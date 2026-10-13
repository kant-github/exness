import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { serializeOrder, settleOrder } from "../trading/orders";

export default async function closeTradeController(req: Request, res: Response) {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const { orderId } = req.body;
    if (typeof orderId !== "string") {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    try {
        const order = await prisma.orders.findFirst({ where: { id: orderId, userId, status: "OPEN" } });
        if (!order) {
            res.status(404).json({ message: "Open order not found" });
            return;
        }

        const price = prices_of_assets.get(order.asset);
        if (!price) {
            res.status(400).json({ message: "Price data not available for this asset" });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const closed = await settleOrder(tx, order, price.bid, price.ask);
            if (!closed) return null;
            const balance = await tx.balance.findUnique({ where: { userId } });
            return { closed, balance };
        });
        if (!result) {
            res.status(404).json({ message: "Open order not found" });
            return;
        }

        res.status(200).json({ order: serializeOrder(result.closed), balance: result.balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
