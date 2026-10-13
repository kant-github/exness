export const PRICE_SCALE = 100_000_000n;
export const QTY_SCALE = 100_000_000n;
// qty(1e8) * price(1e8) / 1e14 = USD * 100 (cents)
const CENTS_DIVISOR = (PRICE_SCALE * QTY_SCALE) / 100n;

export type Side = "LONG" | "SHORT";
export type CloseReason = "MANUAL" | "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION";

export interface PositionLike {
    type: Side;
    price: bigint;
    quantity: bigint;
    margin: bigint;
    stopLoss: bigint | null;
    takeProfit: bigint | null;
}

export function parseScaled(value: unknown): bigint | null {
    let text: string;
    if (typeof value === "number") {
        if (!Number.isFinite(value) || value < 0) return null;
        text = value.toFixed(8);
    } else if (typeof value === "string") {
        text = value.trim();
    } else {
        return null;
    }
    const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
    if (!match) return null;
    const whole = match[1]!;
    const fraction = (match[2] ?? "").padEnd(8, "0").slice(0, 8);
    return BigInt(whole) * PRICE_SCALE + BigInt(fraction);
}

export function formatScaled(value: bigint): string {
    const negative = value < 0n;
    const abs = negative ? -value : value;
    const whole = abs / PRICE_SCALE;
    const fraction = (abs % PRICE_SCALE).toString().padStart(8, "0").replace(/0+$/, "");
    return `${negative ? "-" : ""}${whole}${fraction ? "." + fraction : ""}`;
}

function floorDiv(a: bigint, b: bigint): bigint {
    const q = a / b;
    return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}

function ceilDiv(a: bigint, b: bigint): bigint {
    return -floorDiv(-a, b);
}

// Rounded up so the platform never under-collects margin; at least one cent.
export function marginCents(quantity: bigint, price: bigint, leverage: number): bigint {
    const margin = ceilDiv(quantity * price, CENTS_DIVISOR * BigInt(leverage));
    return margin < 1n ? 1n : margin;
}

// Longs open at the ask and close at the bid; shorts open at the bid and close at the ask.
export function openingPrice(side: Side, bid: bigint, ask: bigint): bigint {
    return side === "LONG" ? ask : bid;
}

export function closingPrice(side: Side, bid: bigint, ask: bigint): bigint {
    return side === "LONG" ? bid : ask;
}

export function pnlCents(side: Side, openPrice: bigint, closePrice: bigint, quantity: bigint): bigint {
    const move = side === "LONG" ? closePrice - openPrice : openPrice - closePrice;
    return floorDiv(move * quantity, CENTS_DIVISOR);
}

export interface Settlement {
    status: "CLOSED" | "LIQUIDATED";
    closeReason: CloseReason;
    closePrice: bigint;
    pnl: bigint;
}

// The loss can never exceed the margin: a position that has lost it all is liquidated at -margin.
export function settle(position: PositionLike, bid: bigint, ask: bigint, reason: CloseReason): Settlement {
    const closePrice = closingPrice(position.type, bid, ask);
    const pnl = pnlCents(position.type, position.price, closePrice, position.quantity);
    if (pnl <= -position.margin) {
        return { status: "LIQUIDATED", closeReason: "LIQUIDATION", closePrice, pnl: -position.margin };
    }
    return { status: "CLOSED", closeReason: reason, closePrice, pnl };
}

export function triggerReason(position: PositionLike, bid: bigint, ask: bigint): CloseReason | null {
    const price = closingPrice(position.type, bid, ask);
    if (pnlCents(position.type, position.price, price, position.quantity) <= -position.margin) {
        return "LIQUIDATION";
    }
    const long = position.type === "LONG";
    if (position.stopLoss !== null && (long ? price <= position.stopLoss : price >= position.stopLoss)) {
        return "STOP_LOSS";
    }
    if (position.takeProfit !== null && (long ? price >= position.takeProfit : price <= position.takeProfit)) {
        return "TAKE_PROFIT";
    }
    return null;
}
