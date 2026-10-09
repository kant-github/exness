import { createPublicKey, type JsonWebKey } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS: [string, ...string[]] = [
    'https://accounts.google.com',
    'accounts.google.com',
];
const DEFAULT_JWKS_TTL_MS = 60 * 60 * 1000;

export interface GoogleIdentity {
    email: string;
    name?: string;
    picture?: string;
}

interface JwksCache {
    keys: Map<string, string>;
    expiresAt: number;
}

let jwksCache: JwksCache | null = null;

function ttlFromCacheControl(header: string | null): number {
    const maxAge = header?.match(/max-age=(\d+)/);
    if (!maxAge?.[1]) {
        return DEFAULT_JWKS_TTL_MS;
    }
    return Number(maxAge[1]) * 1000;
}

async function fetchSigningKeys(): Promise<JwksCache> {
    const response = await fetch(GOOGLE_JWKS_URL);
    if (!response.ok) {
        throw new Error(`Could not fetch Google signing keys: ${response.status}`);
    }

    const body = (await response.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
    const keys = new Map<string, string>();
    for (const jwk of body.keys ?? []) {
        if (!jwk.kid) {
            continue;
        }
        // Google publishes JWKs; jsonwebtoken needs a PEM.
        const pem = createPublicKey({ key: jwk, format: 'jwk' }).export({
            type: 'spki',
            format: 'pem',
        });
        keys.set(jwk.kid, pem.toString());
    }

    if (keys.size === 0) {
        throw new Error('Google returned no usable signing keys');
    }

    return {
        keys,
        expiresAt: Date.now() + ttlFromCacheControl(response.headers.get('cache-control')),
    };
}

async function getSigningKey(kid: string): Promise<string> {
    const cached = jwksCache;
    if (cached && cached.expiresAt > Date.now()) {
        const key = cached.keys.get(kid);
        if (key) {
            return key;
        }
    }

    // Unknown kid or stale cache: Google rotates its keys, so refetch once.
    jwksCache = await fetchSigningKeys();
    const key = jwksCache.keys.get(kid);
    if (!key) {
        throw new Error(`Google id_token was signed with an unknown key: ${kid}`);
    }
    return key;
}

/**
 * Verifies that `idToken` really is an ID token Google issued for this app,
 * and returns the identity it asserts. Throws if it cannot be trusted.
 */
export async function verifyGoogleIdToken(
    idToken: string,
    audience: string,
): Promise<GoogleIdentity> {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || decoded.header.alg !== 'RS256' || !decoded.header.kid) {
        throw new Error('Not a Google-signed RS256 id_token');
    }

    const signingKey = await getSigningKey(decoded.header.kid);
    const payload = jwt.verify(idToken, signingKey, {
        algorithms: ['RS256'],
        audience,
        issuer: GOOGLE_ISSUERS,
    }) as JwtPayload;

    if (typeof payload.email !== 'string' || payload.email.length === 0) {
        throw new Error('Google id_token carries no email claim');
    }
    if (payload.email_verified === false) {
        throw new Error('Google has not verified this email address');
    }

    return {
        email: payload.email,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    };
}
