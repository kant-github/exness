import prisma from "@repo/db/client";
import { Request, Response } from "express";

const DEMO_TOP_UP_AMOUNT = 10000;

export default async function topUpController(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const balance = await prisma.balance.upsert({
            where: { userId: String(userId) },
            create: {
                userId: String(userId),
                total: 10000 + DEMO_TOP_UP_AMOUNT,
                tradable: 10000 + DEMO_TOP_UP_AMOUNT,
            },
            update: {
                total: { increment: DEMO_TOP_UP_AMOUNT },
                tradable: { increment: DEMO_TOP_UP_AMOUNT },
            },
        });

        res.status(200).json({ balance });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
}
