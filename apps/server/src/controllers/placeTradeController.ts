import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { ALLOWED_LEVERAGE, OrderSide } from "../trading/math";
import { TradeError, openOrder, serializeOrder } from "../trading/orderService";
import { trackPosition } from "../trading/openPositions";

const SIDE_BY_TYPE: Record<string, OrderSide> = { ASK: "LONG", BID: "SHORT" };

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !(type in SIDE_BY_TYPE) || typeof lots !== "number" || !Number.isFinite(lots) || lots <= 0) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    if (!ALLOWED_LEVERAGE.includes(levarage)) {
        res.status(411).json({ message: "Invalid leverage" });
        return;
    }

    const quote = prices_of_assets.get(asset);
    if (!quote) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    try {
        const order = await openOrder({
            userId: String(userId),
            asset,
            side: SIDE_BY_TYPE[type]!,
            lots,
            leverage: levarage,
            quote,
        });
        trackPosition(order);
        const balance = await prisma.balance.findUnique({ where: { userId: String(userId) } });
        res.status(200).json({ order: serializeOrder(order), balance });
    } catch (err) {
        if (err instanceof TradeError) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
