import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { serializeOrder } from "../trading/settlement";

export default async function getOrdersController(req: Request, res: Response) {
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const status = req.query.status === "CLOSED" ? "CLOSED" : "OPEN";

    try {
        // "Closed" history includes liquidated positions.
        const orders = await prisma.orders.findMany({
            where: status === "CLOSED"
                ? { userId: String(userId), status: { in: ["CLOSED", "LIQUIDATED"] } }
                : { userId: String(userId), status: "OPEN" },
        });

        res.status(200).json({
            orders: orders
                .map(serializeOrder)
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
        });
    } catch (err) {
        console.error("Failed to fetch orders:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}