import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '@repo/db/client';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
const GOOGLE_ISSUERS: [string, string] = ['https://accounts.google.com', 'accounts.google.com'];
const CERTS_TTL_MS = 60 * 60 * 1000;

let cachedCerts: Record<string, string> | null = null;
let certsFetchedAt = 0;

async function getGoogleCert(kid: string, forceRefresh = false): Promise<string | null> {
    if (forceRefresh || !cachedCerts || Date.now() - certsFetchedAt > CERTS_TTL_MS) {
        const response = await fetch(GOOGLE_CERTS_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch Google certs: ${response.status}`);
        }
        cachedCerts = (await response.json()) as Record<string, string>;
        certsFetchedAt = Date.now();
    }
    return cachedCerts[kid] ?? null;
}

async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<JwtPayload | null> {
    const decoded = jwt.decode(idToken, { complete: true });
    const kid = decoded?.header.kid;
    if (!kid) {
        return null;
    }

    // Google rotates its signing keys, so a miss on the cached set means refetch once.
    let cert = await getGoogleCert(kid);
    if (!cert) {
        cert = await getGoogleCert(kid, true);
    }
    if (!cert) {
        return null;
    }

    try {
        const payload = jwt.verify(idToken, cert, {
            algorithms: ['RS256'],
            issuer: GOOGLE_ISSUERS,
            audience: clientId,
        });
        return typeof payload === 'object' ? payload : null;
    } catch {
        return null;
    }
}

export default async function signInController(req: Request, res: Response) {

    const idToken = req.body?.account?.id_token;
    if (!idToken || typeof idToken !== 'string') {
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
        return;
    }

    const secret = process.env.JWT_SECRET;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!secret || !googleClientId) {
        res.status(500).json({
            message: 'Server error',
        });
        return;
    }

    try {
        const googleUser = await verifyGoogleIdToken(idToken, googleClientId);
        if (!googleUser || typeof googleUser.email !== 'string' || googleUser.email_verified !== true) {
            res.status(401).json({
                success: false,
                error: 'Authentication failed',
            });
            return;
        }

        const email = googleUser.email;
        const name = typeof googleUser.name === 'string' ? googleUser.name : email;
        const image = typeof googleUser.picture === 'string' ? googleUser.picture : null;

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        let myUser;
        if (existingUser) {
            myUser = await prisma.user.update({
                where: {
                    email: email,
                },
                data: {
                    name: name,
                    email: email,
                    image: image,
                },
            });
        } else {
            myUser = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    image: image,
                    Balance: {
                        create: {}
                    }
                },
            });
        }

        const jwtPayload = {
            name: myUser.name,
            email: myUser.email,
            id: myUser.id,
        };
        const token = jwt.sign(jwtPayload, secret);

        res.json({
            success: true,
            user: myUser,
            token: token,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
        return;
    }
}
