import { Orders } from "../types/prisma-types";

export function formatUsd(cents: number): string {
    return (cents / 100).toFixed(2);
}

export function formatSignedUsd(cents: number): string {
    return `${cents > 0 ? "+" : ""}${formatUsd(cents)}`;
}

// A long closes at the bid, a short at the ask. A loss can never exceed the margin.
export function livePnlCents(position: Orders, bidPrice: string | undefined, askPrice: string | undefined): number | null {
    const bid = parseFloat(bidPrice ?? "");
    const ask = parseFloat(askPrice ?? "");
    if (!(bid > 0) || !(ask > 0)) return null;
    const open = parseFloat(position.price);
    const lots = parseFloat(position.lots);
    const move = position.type === "LONG" ? bid - open : open - ask;
    return Math.max(Math.floor(move * lots * 100), -position.margin);
}
