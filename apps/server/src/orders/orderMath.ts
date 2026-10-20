import { Orders, OrderType, EntryType } from "@prisma/client";

export interface SerializedOrder {
    id: string;
    userId: string;
    type: OrderType;
    asset: string;
    entryType: EntryType;
    triggerPrice: number | null;
    price: number;
    quantity: number;
    margin: number;
    levarage: number;
    decimals: number;
    status: string;
    stopLoss: number | null;
    takeProfit: number | null;
    closePrice: number | null;
    closeReason: string | null;
    createdAt: string;
    openedAt: string | null;
    closedAt: string | null;
}

export function serializeOrder(order: Orders): SerializedOrder {
    return {
        id: order.id,
        userId: order.userId,
        type: order.type,
        asset: order.asset,
        entryType: order.entryType,
        triggerPrice: order.triggerPrice !== null ? Number(order.triggerPrice) : null,
        price: Number(order.price),
        quantity: Number(order.quantity),
        margin: Number(order.margin),
        levarage: order.levarage,
        decimals: order.decimals,
        status: order.status,
        stopLoss: order.stopLoss !== null ? Number(order.stopLoss) : null,
        takeProfit: order.takeProfit !== null ? Number(order.takeProfit) : null,
        closePrice: order.closePrice !== null ? Number(order.closePrice) : null,
        closeReason: order.closeReason ?? null,
        createdAt: order.createdAt.toISOString(),
        openedAt: order.openedAt ? order.openedAt.toISOString() : null,
        closedAt: order.closedAt ? order.closedAt.toISOString() : null,
    };
}

/**
 * Margin held for an open position, rounded up to whole account units
 * (the Balance table stores whole units).
 */
export function computeMargin(price: number, quantity: number, leverage: number): number {
    if (leverage <= 0) leverage = 1;
    return Math.ceil((price * quantity) / leverage);
}

/** Realized profit/loss when a position is closed at `closePrice`. */
export function computePnl(
    side: OrderType,
    openPrice: number,
    closePrice: number,
    quantity: number
): number {
    const diff = side === "LONG" ? closePrice - openPrice : openPrice - closePrice;
    return diff * quantity;
}

/**
 * The price at which an open position runs out of margin
 * (equity reaches zero) — used for liquidation checks.
 */
export function liquidationPrice(
    side: OrderType,
    openPrice: number,
    quantity: number,
    margin: number
): number {
    const move = quantity > 0 ? margin / quantity : 0;
    return side === "LONG" ? openPrice - move : openPrice + move;
}

/**
 * Whether a pending order's entry condition is met at the given
 * bid/ask, and the price it should fill at.
 */
export function pendingTriggerFill(
    order: { type: OrderType; entryType: EntryType; triggerPrice: number },
    bid: number,
    ask: number
): number | null {
    const trigger = order.triggerPrice;
    if (trigger === null || trigger === undefined || trigger <= 0) return null;

    if (order.type === "LONG") {
        // Buy limit: fill when sellers come down to our price
        if (order.entryType === "LIMIT" && bid <= trigger) return trigger;
        // Buy stop: fill when price breaks above our level
        if (order.entryType === "STOP" && ask >= trigger) return trigger;
    } else {
        // Sell limit: fill when buyers rise to our price
        if (order.entryType === "LIMIT" && ask >= trigger) return trigger;
        // Sell stop: fill when price breaks below our level
        if (order.entryType === "STOP" && bid <= trigger) return trigger;
    }
    return null;
}

/**
 * The closing price + reason for an open position at the given bid/ask,
 * or null when nothing should fire. Stop loss and take profit fill at
 * the exact level the user chose; liquidation closes at market.
 */
export function exitTrigger(
    order: { type: OrderType; price: number; quantity: number; margin: number; stopLoss: number | null; takeProfit: number | null },
    bid: number,
    ask: number
): { price: number; reason: "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION" } | null {
    const closePrice = order.type === "LONG" ? bid : ask;

    if (order.stopLoss !== null && order.stopLoss > 0) {
        if (order.type === "LONG" && bid <= order.stopLoss) {
            return { price: order.stopLoss, reason: "STOP_LOSS" };
        }
        if (order.type === "SHORT" && ask >= order.stopLoss) {
            return { price: order.stopLoss, reason: "STOP_LOSS" };
        }
    }

    if (order.takeProfit !== null && order.takeProfit > 0) {
        if (order.type === "LONG" && bid >= order.takeProfit) {
            return { price: order.takeProfit, reason: "TAKE_PROFIT" };
        }
        if (order.type === "SHORT" && ask <= order.takeProfit) {
            return { price: order.takeProfit, reason: "TAKE_PROFIT" };
        }
    }

    const liq = liquidationPrice(order.type, order.price, order.quantity, order.margin);
    if (
        (order.type === "LONG" && bid <= liq) ||
        (order.type === "SHORT" && ask >= liq)
    ) {
        return { price: closePrice, reason: "LIQUIDATION" };
    }

    return null;
}
