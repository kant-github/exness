import { Request, Response } from "express";
import { prices_of_assets } from "../prices/live_prices";
import prisma from "@repo/db/client";
import { getEngine } from "../orders/engineSingleton";
import { serializeOrder } from "../orders/orderMath";

const trade_type = ["BID", "ASK"];
const entry_types = ["MARKET", "LIMIT", "STOP"];
const leverages = [1, 5, 10, 20, 100];

const ASSET_DECIMALS: Record<string, number> = {
    BTCUSDT: 2,
    ETHUSDT: 2,
    BNBUSDT: 2,
    XRPUSDT: 4,
    ADAUSDT: 4,
};

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage, entryType, triggerPrice, stopLoss, takeProfit } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !trade_type.includes(type) || !(Number(lots) > 0)) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    if (!leverages.includes(Number(levarage))) {
        res.status(411).json({ message: "Invalid leverage" });
        return;
    }

    const entry = entryType ?? "MARKET";
    if (!entry_types.includes(entry)) {
        res.status(411).json({ message: "Invalid entry type" });
        return;
    }

    const assetPrices = prices_of_assets.get(asset);
    if (!assetPrices) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    const currentAsk = parseFloat(String(assetPrices.ask));
    const currentBid = parseFloat(String(assetPrices.bid));

    // ASK = buy (go long) at the ask, BID = sell (go short) at the bid
    const side = type === "ASK" ? "LONG" : "SHORT";

    let trigger: number | null = null;
    if (entry !== "MARKET") {
        trigger = Number(triggerPrice);
        if (!(trigger > 0)) {
            res.status(411).json({ message: "A trigger price is required for limit and stop orders" });
            return;
        }
        if (entry === "LIMIT") {
            // limit waits for a better price than the market
            if (side === "LONG" && trigger >= currentAsk) {
                res.status(411).json({ message: "Buy limit price must be below the current ask" });
                return;
            }
            if (side === "SHORT" && trigger <= currentBid) {
                res.status(411).json({ message: "Sell limit price must be above the current bid" });
                return;
            }
        } else {
            // stop waits for the price to break past a level
            if (side === "LONG" && trigger <= currentAsk) {
                res.status(411).json({ message: "Buy stop price must be above the current ask" });
                return;
            }
            if (side === "SHORT" && trigger >= currentBid) {
                res.status(411).json({ message: "Sell stop price must be below the current bid" });
                return;
            }
        }
    }

    // the reference price the SL/TP levels must sit around
    const reference = entry === "MARKET" ? (side === "LONG" ? currentAsk : currentBid) : trigger as number;

    const sl = stopLoss === undefined || stopLoss === null || stopLoss === "" ? null : Number(stopLoss);
    const tp = takeProfit === undefined || takeProfit === null || takeProfit === "" ? null : Number(takeProfit);

    if (sl !== null) {
        if (!(sl > 0)) {
            res.status(411).json({ message: "Invalid stop loss" });
            return;
        }
        if (side === "LONG" && sl >= reference) {
            res.status(411).json({ message: "For a buy, the stop loss must be below the entry price" });
            return;
        }
        if (side === "SHORT" && sl <= reference) {
            res.status(411).json({ message: "For a sell, the stop loss must be above the entry price" });
            return;
        }
    }

    if (tp !== null) {
        if (!(tp > 0)) {
            res.status(411).json({ message: "Invalid take profit" });
            return;
        }
        if (side === "LONG" && tp <= reference) {
            res.status(411).json({ message: "For a buy, the take profit must be above the entry price" });
            return;
        }
        if (side === "SHORT" && tp >= reference) {
            res.status(411).json({ message: "For a sell, the take profit must be below the entry price" });
            return;
        }
    }

    try {
        const created = await prisma.orders.create({
            data: {
                userId,
                type: side,
                asset,
                entryType: entry,
                triggerPrice: entry === "MARKET" ? null : trigger,
                price: 0,
                quantity: Number(lots),
                margin: 0,
                levarage: Number(levarage),
                decimals: ASSET_DECIMALS[asset] ?? 2,
                status: "PENDING",
                stopLoss: sl,
                takeProfit: tp,
            },
        });

        if (entry === "MARKET") {
            const fillPrice = side === "LONG" ? currentAsk : currentBid;
            const result = await getEngine().openOrder(created.id, fillPrice);
            const order = result ?? (await prisma.orders.findUnique({ where: { id: created.id } }));
            if (!order) {
                res.status(500).json({ message: "Order could not be opened" });
                return;
            }
            if (order.status === "REJECTED") {
                res.status(400).json({
                    message: "Not enough free balance to open this trade",
                    order: serializeOrder(order),
                });
                return;
            }
            res.status(200).json({ order: serializeOrder(order) });
            return;
        }

        res.status(200).json({ order: serializeOrder(created) });
    } catch (err) {
        console.error("failed to place order:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}
