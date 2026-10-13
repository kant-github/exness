import { Request, Response } from "express";
import { MAX_PRICE_AGE_MS, prices_of_assets } from "../prices/live_prices";
import { parseScaled } from "../trading/math";
import { TradeError, closePosition } from "../trading/positionService";
import { untrackPosition } from "../trading/engine";
import { serializeBalance, serializePosition } from "../trading/serialize";
import prisma from "@repo/db/client";

export default async function closeTradeController(req: Request, res: Response) {
    const userId = req.user?.id;
    const id = req.params.id;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (typeof id !== "string" || !id) {
        res.status(400).json({ message: "Incorrect inputs" });
        return;
    }

    try {
        const existing = await prisma.orders.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            res.status(404).json({ message: "Position not found" });
            return;
        }

        const live = prices_of_assets.get(existing.asset);
        if (!live || Date.now() - live.updatedAt > MAX_PRICE_AGE_MS) {
            res.status(400).json({ message: "Price data not available for this asset" });
            return;
        }
        const bid = parseScaled(live.bid);
        const ask = parseScaled(live.ask);
        if (bid === null || ask === null) {
            res.status(400).json({ message: "Price data not available for this asset" });
            return;
        }

        const closed = await closePosition({ id, userId, bid, ask, reason: "MANUAL" });
        if (!closed) {
            untrackPosition({ id, asset: existing.asset });
            res.status(409).json({ message: "Position is already closed" });
            return;
        }
        untrackPosition({ id, asset: existing.asset });
        res.status(200).json({ position: serializePosition(closed.position), balance: serializeBalance(closed.balance) });
    } catch (err) {
        if (err instanceof TradeError) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
