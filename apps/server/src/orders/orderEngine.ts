import prisma from "@repo/db/client";
import type Redis from "ioredis";
import {
    computeMargin,
    computePnl,
    exitTrigger,
    pendingTriggerFill,
    serializeOrder,
} from "./orderMath";

export const ORDERS_CHANNEL = "ws:events:orders";

export type OrderEventType = "ORDER_OPENED" | "ORDER_CLOSED" | "ORDER_REJECTED";

export interface OrderEventPayload {
    type: "order_event";
    userId: string;
    event: OrderEventType;
    message: string;
    order: ReturnType<typeof serializeOrder>;
    balance: { total: number; tradable: number; locked: number } | null;
}

/**
 * Evaluates orders against live prices.
 *
 * Every tick for a symbol is processed strictly in order (per-symbol
 * promise chain), and every state change is claimed atomically via a
 * status-guarded `updateMany`, so a trade can never open or close twice
 * even when the price jumps around.
 */
export class OrderEngine {
    private publisher: Redis;
    private chains: Map<string, Promise<void>> = new Map();

    constructor(publisher: Redis) {
        this.publisher = publisher;
    }

    /** Called on every live price update. Never throws. */
    processTick(symbol: string, bid: number, ask: number): void {
        const prev = this.chains.get(symbol) ?? Promise.resolve();
        const next = prev
            .then(() => this.evaluate(symbol, bid, ask))
            .catch((err) => {
                console.error(`order engine error for ${symbol}:`, err);
            });
        this.chains.set(symbol, next);
    }

    private async evaluate(symbol: string, bid: number, ask: number): Promise<void> {
        const pendingOrders = await prisma.orders.findMany({
            where: { asset: symbol, status: "PENDING" },
        });

        for (const order of pendingOrders) {
            const trigger =
                order.triggerPrice === null ? null : Number(order.triggerPrice);
            if (trigger === null) continue;

            const fill = pendingTriggerFill(
                {
                    type: order.type,
                    entryType: order.entryType,
                    triggerPrice: trigger,
                },
                bid,
                ask
            );
            if (fill === null) continue;

            await this.openOrder(order.id, fill);
        }

        const openOrders = await prisma.orders.findMany({
            where: { asset: symbol, status: "OPEN" },
        });

        for (const order of openOrders) {
            const exit = exitTrigger(
                {
                    type: order.type,
                    price: Number(order.price),
                    quantity: Number(order.quantity),
                    margin: Number(order.margin),
                    stopLoss: order.stopLoss === null ? null : Number(order.stopLoss),
                    takeProfit: order.takeProfit === null ? null : Number(order.takeProfit),
                },
                bid,
                ask
            );
            if (exit === null) continue;

            await this.closeOrder(order.id, exit.price, exit.reason);
        }
    }

    /**
     * Atomically moves a PENDING order to OPEN and holds its margin.
     * Money is only held at this point — never while waiting.
     * If there is not enough tradable balance the order is marked
     * REJECTED with reason INSUFFICIENT_FUNDS instead.
     * Returns the updated order, or null if the order was already
     * claimed (never opens twice).
     */
    async openOrder(orderId: string, fillPrice: number) {
        const claimed = await prisma.orders.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: { status: "OPEN", price: fillPrice, openedAt: new Date() },
        });
        if (claimed.count === 0) return null;

        const order = await prisma.orders.findUnique({ where: { id: orderId } });
        if (!order) return null;

        const margin = computeMargin(fillPrice, Number(order.quantity), order.levarage);

        const held = await prisma.balance.updateMany({
            where: { userId: order.userId, tradable: { gte: margin } },
            data: { tradable: { decrement: margin }, locked: { increment: margin } },
        });

        if (held.count === 0) {
            const rejected = await prisma.orders.update({
                where: { id: orderId },
                data: {
                    status: "REJECTED",
                    margin,
                    closeReason: "INSUFFICIENT_FUNDS",
                    closedAt: new Date(),
                },
            });
            await this.publishEvent(
                order.userId,
                "ORDER_REJECTED",
                `${rejected.asset} ${rejected.type} not opened: insufficient funds`,
                rejected
            );
            return rejected;
        }

        const opened = await prisma.orders.update({
            where: { id: orderId },
            data: { margin },
        });

        await this.publishEvent(
            order.userId,
            "ORDER_OPENED",
            `${opened.asset} ${opened.type} opened at ${fillPrice}`,
            opened
        );
        return opened;
    }

    /**
     * Atomically moves an OPEN order to CLOSED, releases its margin and
     * settles the profit/loss. Returns the closed order, or null if the
     * order was already closed (never closes twice).
     */
    async closeOrder(orderId: string, closePrice: number, reason: "USER" | "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION") {
        const claimed = await prisma.orders.updateMany({
            where: { id: orderId, status: "OPEN" },
            data: { status: "CLOSED", closePrice, closeReason: reason, closedAt: new Date() },
        });
        if (claimed.count === 0) return null;

        const order = await prisma.orders.findUnique({ where: { id: orderId } });
        if (!order) return null;

        const margin = Number(order.margin);
        const pnl = computePnl(order.type, Number(order.price), closePrice, Number(order.quantity));
        const release = Math.max(0, Math.round(margin + pnl));

        await prisma.$transaction(async (tx) => {
            const released = await tx.balance.updateMany({
                where: { userId: order.userId, locked: { gte: margin } },
                data: {
                    locked: { decrement: margin },
                    tradable: { increment: release },
                },
            });
            if (released.count > 0) {
                const balance = await tx.balance.findUnique({ where: { userId: order.userId } });
                if (balance) {
                    await tx.balance.update({
                        where: { userId: order.userId },
                        data: { total: balance.tradable + balance.locked },
                    });
                }
            }
        });

        const reasonLabel: Record<string, string> = {
            USER: "closed",
            STOP_LOSS: "closed by stop loss",
            TAKE_PROFIT: "closed by take profit",
            LIQUIDATION: "liquidated (out of margin)",
        };

        await this.publishEvent(
            order.userId,
            "ORDER_CLOSED",
            `${order.asset} ${order.type} ${reasonLabel[reason] ?? "closed"} at ${closePrice}`,
            order
        );
        return order;
    }

    private async publishEvent(
        userId: string,
        event: OrderEventType,
        message: string,
        order: Parameters<typeof serializeOrder>[0]
    ) {
        try {
            const balance = await prisma.balance.findUnique({ where: { userId } });
            const payload: OrderEventPayload = {
                type: "order_event",
                userId,
                event,
                message,
                order: serializeOrder(order),
                balance: balance
                    ? { total: balance.total, tradable: balance.tradable, locked: balance.locked }
                    : null,
            };
            await this.publisher.publish(ORDERS_CHANNEL, JSON.stringify(payload));
        } catch (err) {
            console.error("failed to publish order event:", err);
        }
    }
}
