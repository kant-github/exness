export type Side = "LONG" | "SHORT";

export const ALLOWED_LEVERAGE = [1, 5, 10, 20, 100];
export const PRICE_DECIMALS = 8;
export const LOT_SCALE = 100;

export function sideFromTradeType(type: "BID" | "ASK"): Side {
    return type === "ASK" ? "LONG" : "SHORT";
}

export function entryPrice(side: Side, bid: number, ask: number): number {
    return side === "LONG" ? ask : bid;
}

export function exitPrice(side: Side, bid: number, ask: number): number {
    return side === "LONG" ? bid : ask;
}

export function toScaledPrice(price: number): bigint {
    return BigInt(Math.round(price * 10 ** PRICE_DECIMALS));
}

export function fromScaledPrice(scaled: bigint, decimals: number): number {
    return Number(scaled) / 10 ** decimals;
}

export function lotsToQuantity(lots: number): bigint {
    return BigInt(Math.round(lots * LOT_SCALE));
}

export function quantityToLots(quantity: bigint): number {
    return Number(quantity) / LOT_SCALE;
}

export function marginCents(price: number, lots: number, leverage: number): number {
    const cents = +((price * lots * 100) / leverage).toFixed(6);
    return Math.max(1, Math.ceil(cents));
}

export function pnlCents(side: Side, entry: number, exit: number, lots: number): number {
    const diff = side === "LONG" ? exit - entry : entry - exit;
    return Math.round(diff * lots * 100);
}

export function isLiquidated(pnl: number, margin: number): boolean {
    return pnl <= -margin;
}
