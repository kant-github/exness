import prisma from "@repo/db/client";
import {
    CloseReason,
    PositionLike,
    Side,
    closingPrice,
    marginCents,
    openingPrice,
    settle,
} from "./math";

export class TradeError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
    }
}

export interface PositionRecord extends PositionLike {
    id: string;
    userId: string;
    asset: string;
    levarage: number;
    status: "OPEN" | "CLOSED" | "LIQUIDATED";
    closePrice: bigint | null;
    pnl: bigint | null;
    closeReason: CloseReason | null;
    createdAt: Date;
    closedAt: Date | null;
}

export interface BalanceRecord {
    total: bigint;
    tradable: bigint;
    locked: bigint;
}

export interface OpenParams {
    userId: string;
    asset: string;
    side: Side;
    quantity: bigint;
    leverage: number;
    stopLoss: bigint | null;
    takeProfit: bigint | null;
    bid: bigint;
    ask: bigint;
}

export async function openPosition(params: OpenParams) {
    const { userId, asset, side, quantity, leverage, stopLoss, takeProfit, bid, ask } = params;
    const price = openingPrice(side, bid, ask);
    const exitPrice = closingPrice(side, bid, ask);

    if (side === "LONG") {
        if (stopLoss !== null && stopLoss >= exitPrice) throw new TradeError("Stop loss must be below the current price for a buy", 400);
        if (takeProfit !== null && takeProfit <= exitPrice) throw new TradeError("Take profit must be above the current price for a buy", 400);
    } else {
        if (stopLoss !== null && stopLoss <= exitPrice) throw new TradeError("Stop loss must be above the current price for a sell", 400);
        if (takeProfit !== null && takeProfit >= exitPrice) throw new TradeError("Take profit must be below the current price for a sell", 400);
    }

    const margin = marginCents(quantity, price, leverage);

    return prisma.$transaction(async (tx) => {
        // One conditional UPDATE: the funds check and the move to locked cannot be interleaved with another trade.
        const moved = await tx.balance.updateMany({
            where: { userId, tradable: { gte: margin } },
            data: { tradable: { decrement: margin }, locked: { increment: margin } },
        });
        if (moved.count === 0) {
            throw new TradeError("Insufficient balance to open this position", 400);
        }

        const position = (await tx.orders.create({
            data: {
                userId,
                type: side,
                asset,
                price,
                quantity,
                margin,
                levarage: leverage,
                stopLoss,
                takeProfit,
                status: "OPEN",
            },
        })) as unknown as PositionRecord;
        const balance = (await tx.balance.findUnique({ where: { userId } })) as BalanceRecord;
        return { position, balance };
    });
}

export interface CloseParams {
    id: string;
    userId?: string;
    bid: bigint;
    ask: bigint;
    reason: CloseReason;
}

// Resolves to null when the position was already closed by someone else.
export async function closePosition(params: CloseParams) {
    const { id, userId, bid, ask, reason } = params;

    return prisma.$transaction(async (tx) => {
        const current = (await tx.orders.findUnique({ where: { id } })) as unknown as PositionRecord | null;
        if (!current || (userId !== undefined && current.userId !== userId)) {
            throw new TradeError("Position not found", 404);
        }
        if (current.status !== "OPEN") return null;

        const result = settle(current, bid, ask, reason);

        // Only the caller that flips OPEN -> closed gets to settle the money.
        const flipped = await tx.orders.updateMany({
            where: { id, status: "OPEN" },
            data: {
                status: result.status,
                closeReason: result.closeReason,
                closePrice: result.closePrice,
                pnl: result.pnl,
                closedAt: new Date(),
            },
        });
        if (flipped.count === 0) return null;

        const balance = (await tx.balance.update({
            where: { userId: current.userId },
            data: {
                locked: { decrement: current.margin },
                tradable: { increment: current.margin + result.pnl },
                total: { increment: result.pnl },
            },
        })) as BalanceRecord;
        const position = (await tx.orders.findUnique({ where: { id } })) as unknown as PositionRecord;
        return { position, balance };
    });
}

export async function listPositions(userId: string) {
    const [open, closed, balance] = await Promise.all([
        prisma.orders.findMany({ where: { userId, status: "OPEN" }, orderBy: { createdAt: "desc" } }),
        prisma.orders.findMany({
            where: { userId, status: { in: ["CLOSED", "LIQUIDATED"] } },
            orderBy: { closedAt: "desc" },
            take: 100,
        }),
        prisma.balance.findUnique({ where: { userId } }),
    ]);
    return {
        open: open as unknown as PositionRecord[],
        closed: closed as unknown as PositionRecord[],
        balance: balance as BalanceRecord | null,
    };
}
