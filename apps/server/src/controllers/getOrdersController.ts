import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { serializeOrder } from "../trading/orders";

export default async function getOrdersController(req: Request, res: Response) {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const orders = await prisma.orders.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ orders: orders.map(serializeOrder) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
