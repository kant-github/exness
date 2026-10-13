import prisma from "@repo/db/client";
import { OrderSide, Quote, exitPrice, fromScaled, isLiquidated, unrealisedPnl } from "./math";
import { TradeError, closeOrder } from "./orderService";

interface Position {
    id: string;
    userId: string;
    asset: string;
    side: OrderSide;
    entry: number;
    lots: number;
    margin: number;
}

const positions = new Map<string, Position>();
const closing = new Set<string>();

export function trackPosition(order: {
    id: string;
    userId: string;
    asset: string;
    type: string;
    price: bigint;
    quantity: bigint;
    margin: bigint;
}) {
    positions.set(order.id, {
        id: order.id,
        userId: order.userId,
        asset: order.asset,
        side: order.type as OrderSide,
        entry: fromScaled(order.price),
        lots: fromScaled(order.quantity),
        margin: Number(order.margin),
    });
}

export function untrackPosition(orderId: string) {
    positions.delete(orderId);
}

export async function loadOpenPositions() {
    const open = await prisma.orders.findMany({ where: { status: "OPEN" } });
    open.forEach(trackPosition);
}

export async function liquidateLosingPositions(asset: string, quote: Quote) {
    for (const position of positions.values()) {
        if (position.asset !== asset || closing.has(position.id)) continue;

        const pnl = unrealisedPnl(position.side, position.entry, exitPrice(position.side, quote), position.lots);
        if (!isLiquidated(pnl, position.margin)) continue;

        closing.add(position.id);
        try {
            await closeOrder(position.userId, position.id, quote, "LIQUIDATED");
            positions.delete(position.id);
        } catch (err) {
            if (err instanceof TradeError) {
                // already closed elsewhere
                positions.delete(position.id);
            } else {
                console.error("Failed to liquidate order", position.id, err);
            }
        } finally {
            closing.delete(position.id);
        }
    }
}
