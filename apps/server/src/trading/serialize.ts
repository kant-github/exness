import { formatScaled } from "./math";
import { BalanceRecord, PositionRecord } from "./positionService";

// Prices and lots go out as decimal strings, money as integer cents (BigInt is not JSON-serialisable).
export function serializePosition(p: PositionRecord) {
    return {
        id: p.id,
        asset: p.asset,
        type: p.type,
        status: p.status,
        price: formatScaled(p.price),
        lots: formatScaled(p.quantity),
        margin: Number(p.margin),
        levarage: p.levarage,
        stopLoss: p.stopLoss === null ? null : formatScaled(p.stopLoss),
        takeProfit: p.takeProfit === null ? null : formatScaled(p.takeProfit),
        closePrice: p.closePrice === null ? null : formatScaled(p.closePrice),
        pnl: p.pnl === null ? null : Number(p.pnl),
        closeReason: p.closeReason,
        createdAt: p.createdAt,
        closedAt: p.closedAt,
    };
}

export function serializeBalance(b: BalanceRecord & { id?: string; userId?: string }) {
    return {
        id: b.id,
        userId: b.userId,
        total: Number(b.total),
        tradable: Number(b.tradable),
        locked: Number(b.locked),
    };
}
