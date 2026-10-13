import { Request, Response } from "express";
import { MAX_PRICE_AGE_MS, prices_of_assets } from "../prices/live_prices";
import { Side, parseScaled } from "../trading/math";
import { TradeError, openPosition } from "../trading/positionService";
import { trackPosition } from "../trading/engine";
import { serializeBalance, serializePosition } from "../trading/serialize";

// BID = Sell (opens a short at the bid), ASK = Buy (opens a long at the ask).
const SIDE_BY_TYPE: Record<string, Side> = { ASK: "LONG", BID: "SHORT" };
const LEVERAGES = [1, 5, 10, 20, 100];
const MIN_LOTS = 0.01;
const MAX_LOTS = 1000;

function optionalPrice(value: unknown): bigint | null | undefined {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseScaled(value);
    return parsed === null || parsed <= 0n ? undefined : parsed;
}

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage, stopLoss, takeProfit } = req.body ?? {};
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const side = typeof type === "string" ? SIDE_BY_TYPE[type] : undefined;
    if (typeof asset !== "string" || !asset || !side) {
        res.status(400).json({ message: "Incorrect inputs" });
        return;
    }

    const lotsNumber = typeof lots === "string" ? Number(lots) : lots;
    if (
        typeof lotsNumber !== "number" ||
        !Number.isFinite(lotsNumber) ||
        lotsNumber < MIN_LOTS ||
        lotsNumber > MAX_LOTS ||
        Math.abs(lotsNumber * 100 - Math.round(lotsNumber * 100)) > 1e-9
    ) {
        res.status(400).json({ message: `Volume must be between ${MIN_LOTS} and ${MAX_LOTS} lots in steps of 0.01` });
        return;
    }

    if (!LEVERAGES.includes(levarage)) {
        res.status(400).json({ message: "Invalid leverage" });
        return;
    }

    const stopLossPrice = optionalPrice(stopLoss);
    const takeProfitPrice = optionalPrice(takeProfit);
    if (stopLossPrice === undefined || takeProfitPrice === undefined) {
        res.status(400).json({ message: "Stop loss and take profit must be positive prices" });
        return;
    }

    const live = prices_of_assets.get(asset);
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

    try {
        const { position, balance } = await openPosition({
            userId,
            asset,
            side,
            quantity: BigInt(Math.round(lotsNumber * 100)) * 1_000_000n,
            leverage: levarage,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            bid,
            ask,
        });
        trackPosition(position);
        res.status(200).json({ position: serializePosition(position), balance: serializeBalance(balance) });
    } catch (err) {
        if (err instanceof TradeError) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
