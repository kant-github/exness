import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { serializeOrder } from "../utils/serializeOrder";

export default async function getTradesController(req: Request, res: Response) {
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const orders = await prisma.orders.findMany({
            where: { userId: String(userId) },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({ orders: orders.map(serializeOrder) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
