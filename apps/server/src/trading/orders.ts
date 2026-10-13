import type { Prisma } from "@prisma/client";
import {
    exitPrice,
    fromScaledPrice,
    isLiquidated,
    pnlCents,
    quantityToLots,
    toScaledPrice,
    type Side,
} from "./orderMath";

type OrderRow = {
    id: string;
    userId: string;
    type: Side;
    asset: string;
    price: bigint;
    quantity: bigint;
    margin: bigint;
    levarage: number;
    decimals: number;
    status: "OPEN" | "CLOSED" | "LIQUIDATED";
    createdAt: Date;
    closePrice: bigint | null;
    pnl: bigint | null;
    closedAt: Date | null;
};

export function serializeOrder(order: OrderRow) {
    return {
        id: order.id,
        type: order.type,
        asset: order.asset,
        price: fromScaledPrice(order.price, order.decimals),
        lots: quantityToLots(order.quantity),
        margin: Number(order.margin) / 100,
        levarage: order.levarage,
        status: order.status,
        createdAt: order.createdAt,
        closePrice: order.closePrice === null ? null : fromScaledPrice(order.closePrice, order.decimals),
        pnl: order.pnl === null ? null : Number(order.pnl) / 100,
        closedAt: order.closedAt,
    };
}

// Returns null when the order was no longer OPEN (closed or liquidated concurrently).
export async function settleOrder(
    tx: Prisma.TransactionClient,
    order: OrderRow,
    bid: number,
    ask: number,
) {
    const exit = exitPrice(order.type, bid, ask);
    const entry = fromScaledPrice(order.price, order.decimals);
    const margin = Number(order.margin);
    const rawPnl = pnlCents(order.type, entry, exit, quantityToLots(order.quantity));
    const liquidated = isLiquidated(rawPnl, margin);
    const pnl = Math.max(rawPnl, -margin);

    const claimed = await tx.orders.updateMany({
        where: { id: order.id, status: "OPEN" },
        data: {
            status: liquidated ? "LIQUIDATED" : "CLOSED",
            closePrice: toScaledPrice(exit),
            pnl: BigInt(pnl),
            closedAt: new Date(),
        },
    });
    if (claimed.count === 0) return null;

    await tx.balance.update({
        where: { userId: order.userId },
        data: {
            locked: { decrement: margin / 100 },
            tradable: { increment: (margin + pnl) / 100 },
            total: { increment: pnl / 100 },
        },
    });

    return tx.orders.findUniqueOrThrow({ where: { id: order.id } });
}
