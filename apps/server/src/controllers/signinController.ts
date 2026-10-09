import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '@repo/db/client';
import { GoogleIdentity, verifyGoogleIdToken } from '../utils/googleIdToken';

export default async function signInController(req: Request, res: Response) {
    const account = req.body?.account;

    const secret = process.env.JWT_SECRET;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!secret || !googleClientId) {
        console.error('JWT_SECRET and GOOGLE_CLIENT_ID must both be configured');
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
        return;
    }

    if (account?.provider !== 'google' || typeof account?.id_token !== 'string') {
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
        return;
    }

    // The identity comes from the token Google signed, never from the request body.
    let identity: GoogleIdentity;
    try {
        identity = await verifyGoogleIdToken(account.id_token, googleClientId);
    } catch (err) {
        console.error('Rejected sign-in: could not verify Google id_token', err);
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
        return;
    }

    const email = identity.email;
    const name = identity.name ?? email;
    const image = identity.picture ?? null;

    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        let myUser;
        if (existingUser) {
            myUser = await prisma.user.update({
                where: {
                    email,
                },
                data: {
                    name,
                    email,
                    image,
                },
            });
        } else {
            myUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    image,
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
