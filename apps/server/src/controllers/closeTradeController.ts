import { Request, Response } from "express";
import { prices_of_assets } from "../prices/live_prices";
import { TradeError, closeOrder, serializeOrder } from "../trading/orderService";
import { untrackPosition } from "../trading/openPositions";
import prisma from "@repo/db/client";

export default async function closeTradeController(req: Request, res: Response) {
    const userId = req?.user?.id;
    const orderId = req.params.id;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const existing = await prisma.orders.findFirst({ where: { id: String(orderId), userId: String(userId), status: "OPEN" } });
        if (!existing) {
            res.status(404).json({ message: "Open order not found" });
            return;
        }

        const quote = prices_of_assets.get(existing.asset);
        if (!quote) {
            res.status(400).json({ message: "Price data not available for this asset" });
            return;
        }

        const order = await closeOrder(String(userId), existing.id, quote);
        untrackPosition(existing.id);
        const balance = await prisma.balance.findUnique({ where: { userId: String(userId) } });
        res.status(200).json({ order: order && serializeOrder(order), balance });
    } catch (err) {
        if (err instanceof TradeError) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
