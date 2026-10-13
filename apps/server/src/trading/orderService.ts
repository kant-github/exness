import prisma from "@repo/db/client";
import {
    DECIMALS,
    OrderSide,
    Quote,
    entryPrice,
    exitPrice,
    fromScaled,
    realisedPnl,
    requiredMargin,
    toScaled,
    unrealisedPnl,
} from "./math";

export class TradeError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export interface OpenOrderInput {
    userId: string;
    asset: string;
    side: OrderSide;
    lots: number;
    leverage: number;
    quote: Quote;
}

export async function openOrder({ userId, asset, side, lots, leverage, quote }: OpenOrderInput) {
    const price = entryPrice(side, quote);
    const margin = requiredMargin(price, lots, leverage);

    return prisma.$transaction(async (tx) => {
        const locked = await tx.balance.updateMany({
            where: { userId, tradable: { gte: margin } },
            data: { tradable: { decrement: margin }, locked: { increment: margin } },
        });
        if (locked.count === 0) {
            throw new TradeError(400, "Insufficient balance");
        }

        return tx.orders.create({
            data: {
                userId,
                type: side,
                asset,
                price: toScaled(price),
                quantity: toScaled(lots),
                margin: BigInt(margin),
                levarage: leverage,
                decimals: DECIMALS,
                status: "OPEN",
            },
        });
    });
}

export async function closeOrder(
    userId: string,
    orderId: string,
    quote: Quote,
    status: "CLOSED" | "LIQUIDATED" = "CLOSED",
) {
    return prisma.$transaction(async (tx) => {
        const order = await tx.orders.findFirst({ where: { id: orderId, userId, status: "OPEN" } });
        if (!order) {
            throw new TradeError(404, "Open order not found");
        }

        const side = order.type as OrderSide;
        const margin = Number(order.margin);
        const exit = exitPrice(side, quote);
        const pnl = status === "LIQUIDATED"
            ? -margin
            : realisedPnl(unrealisedPnl(side, fromScaled(order.price), exit, fromScaled(order.quantity)), margin);

        const claimed = await tx.orders.updateMany({
            where: { id: orderId, status: "OPEN" },
            data: { status, closePrice: toScaled(exit), pnl, closedAt: new Date() },
        });
        if (claimed.count === 0) {
            throw new TradeError(404, "Open order not found");
        }

        await tx.balance.updateMany({
            where: { userId },
            data: {
                total: { increment: pnl },
                tradable: { increment: margin + pnl },
                locked: { decrement: margin },
            },
        });

        return tx.orders.findFirst({ where: { id: orderId } });
    });
}

export async function listOrders(userId: string) {
    return prisma.orders.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export function serializeOrder(order: {
    id: string;
    type: string;
    asset: string;
    price: bigint;
    quantity: bigint;
    margin: bigint;
    levarage: number;
    status: string;
    createdAt: Date;
    closePrice?: bigint | null;
    pnl?: number | null;
    closedAt?: Date | null;
}) {
    return {
        id: order.id,
        type: order.type,
        asset: order.asset,
        price: fromScaled(order.price),
        lots: fromScaled(order.quantity),
        margin: Number(order.margin),
        levarage: order.levarage,
        status: order.status,
        createdAt: order.createdAt,
        closePrice: order.closePrice == null ? null : fromScaled(order.closePrice),
        pnl: order.pnl ?? null,
        closedAt: order.closedAt ?? null,
    };
}
