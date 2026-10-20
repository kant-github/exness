import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { getEngine } from "../orders/engineSingleton";
import { serializeOrder } from "../orders/orderMath";

export async function getOrdersController(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const orders = await prisma.orders.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 200,
        });
        res.status(200).json({ orders: orders.map(serializeOrder) });
    } catch (err) {
        console.error("failed to fetch orders:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateOrderController(req: Request, res: Response) {
    const userId = req?.user?.id;
    const { id } = req.params;
    const { triggerPrice, stopLoss, takeProfit } = req.body;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const order = await prisma.orders.findUnique({ where: { id } });
        if (!order || order.userId !== userId) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        const data: {
            triggerPrice?: number | null;
            stopLoss?: number | null;
            takeProfit?: number | null;
        } = {};

        if (order.status === "PENDING") {
            if (triggerPrice !== undefined && triggerPrice !== null) {
                const t = Number(triggerPrice);
                if (!(t > 0)) {
                    res.status(411).json({ message: "Invalid trigger price" });
                    return;
                }
                data.triggerPrice = t;
            }
        } else if (triggerPrice !== undefined && triggerPrice !== null) {
            res.status(411).json({ message: "Only pending orders have an entry price" });
            return;
        }

        if (stopLoss !== undefined) {
            if (stopLoss === null || stopLoss === "") {
                data.stopLoss = null;
            } else {
                const sl = Number(stopLoss);
                if (!(sl > 0)) {
                    res.status(411).json({ message: "Invalid stop loss" });
                    return;
                }
                data.stopLoss = sl;
            }
        }

        if (takeProfit !== undefined) {
            if (takeProfit === null || takeProfit === "") {
                data.takeProfit = null;
            } else {
                const tp = Number(takeProfit);
                if (!(tp > 0)) {
                    res.status(411).json({ message: "Invalid take profit" });
                    return;
                }
                data.takeProfit = tp;
            }
        }

        if (Object.keys(data).length === 0) {
            res.status(411).json({ message: "Nothing to update" });
            return;
        }

        const updated = await prisma.orders.update({ where: { id }, data });
        res.status(200).json({ order: serializeOrder(updated) });
    } catch (err) {
        console.error("failed to update order:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function cancelOrderController(req: Request, res: Response) {
    const userId = req?.user?.id;
    const { id } = req.params;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const order = await prisma.orders.findUnique({ where: { id } });
        if (!order || order.userId !== userId) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.status !== "PENDING") {
            res.status(409).json({ message: "Only pending orders can be cancelled" });
            return;
        }

        const cancelled = await prisma.orders.update({
            where: { id },
            data: { status: "CANCELLED", closedAt: new Date() },
        });
        res.status(200).json({ order: serializeOrder(cancelled) });
    } catch (err) {
        console.error("failed to cancel order:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function closeOrderController(req: Request, res: Response) {
    const userId = req?.user?.id;
    const { id } = req.params;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const order = await prisma.orders.findUnique({ where: { id } });
        if (!order || order.userId !== userId) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.status !== "OPEN") {
            res.status(409).json({ message: "Order is not open" });
            return;
        }

        const assetPrices = prices_of_assets.get(order.asset);
        if (!assetPrices) {
            res.status(400).json({ message: "Price data not available for this asset" });
            return;
        }

        // closing a long sells at the bid, closing a short buys back at the ask
        const closePrice =
            order.type === "LONG"
                ? parseFloat(String(assetPrices.bid))
                : parseFloat(String(assetPrices.ask));

        const closed = await getEngine().closeOrder(order.id, closePrice, "USER");
        if (!closed) {
            res.status(409).json({ message: "Order was already closed" });
            return;
        }

        const fresh = await prisma.orders.findUnique({ where: { id } });
        res.status(200).json({ order: fresh ? serializeOrder(fresh) : null });
    } catch (err) {
        console.error("failed to close order:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}
