import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { settleOrder } from "../trading/settle";

export default async function closeTradeController(req: Request, res: Response) {
    const { orderId } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (!orderId) {
        res.status(411).json({ message: "orderId is required" });
        return;
    }

    const order = await prisma.orders.findFirst({
        where: { id: String(orderId), userId: String(userId), status: "OPEN" },
    });
    if (!order) {
        res.status(404).json({ message: "Open order not found" });
        return;
    }

    const asset_price = prices_of_assets.get(order.asset);
    if (!asset_price) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    // A LONG exits at the bid, a SHORT covers at the ask.
    const exit_price = order.type === "LONG" ? asset_price.bid : asset_price.ask;

    try {
        const result = await settleOrder(order, exit_price, "CLOSED");
        res.status(200).json(result);
    } catch (err) {
        console.error("Failed to close order:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}