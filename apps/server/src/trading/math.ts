export const DECIMALS = 8;
export const SCALE = 10 ** DECIMALS;
export const ALLOWED_LEVERAGE = [1, 5, 10, 20, 100];

export type OrderSide = "LONG" | "SHORT";

export interface Quote {
    bid: number;
    ask: number;
}

export function toScaled(value: number): bigint {
    return BigInt(Math.round(value * SCALE));
}

export function fromScaled(value: bigint | number): number {
    return Number(value) / SCALE;
}

// Opening a long buys at the ask; opening a short sells at the bid.
export function entryPrice(side: OrderSide, quote: Quote): number {
    return side === "LONG" ? quote.ask : quote.bid;
}

// Closing a long sells at the bid; closing a short buys back at the ask.
export function exitPrice(side: OrderSide, quote: Quote): number {
    return side === "LONG" ? quote.bid : quote.ask;
}

export function requiredMargin(price: number, lots: number, leverage: number): number {
    return Math.max(1, Math.ceil((price * lots) / leverage));
}

export function unrealisedPnl(side: OrderSide, entry: number, exit: number, lots: number): number {
    return side === "LONG" ? (exit - entry) * lots : (entry - exit) * lots;
}

// A position is liquidated once its loss reaches the margin that backs it.
export function isLiquidated(pnl: number, margin: number): boolean {
    return pnl <= -margin;
}

// Realised result of closing, never worse than losing the whole margin.
export function realisedPnl(pnl: number, margin: number): number {
    return Math.max(-margin, Math.round(pnl));
}
