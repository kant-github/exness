import prisma from "@repo/db/client";
import { Request, Response } from "express";
import { serializeOrder } from "../lib/serializeOrder";

export default async function getUserDataController(req: Request, res: Response) {
    if (!req.user?.id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: String(req.user.id)
            }, include: {
                Balance: true,
                Orders: true
            }
        })

        res.status(200).json({
            user: user ? { ...user, Orders: user.Orders.map(serializeOrder) } : user
        })
        return;
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
}