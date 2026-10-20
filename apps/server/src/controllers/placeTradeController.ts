import { Request, Response } from "express";
import { prices_of_assets } from "../prices/live_prices";
import prisma from "@repo/db/client";

const trade_type = ['BID', 'ASK']

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !trade_type.includes(type) || lots <= 0) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    if (![1, 5, 10, 20, 100].includes(levarage)) {
        res.status(411).json({ message: "Invalid leverage" });
        return;
    }

    const asset_current_price = prices_of_assets.get(asset);
    if (!asset_current_price) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    const price_from_binance = type === "BID" ? asset_current_price.bid : asset_current_price.ask;

    const priceStr = price_from_binance.toString();
    const decimalPart = priceStr.split('.')[1] || '';
    const decimals = decimalPart.length || 1;
    const multiplier = Math.pow(10, decimals);

    const priceBigInt = BigInt(Math.round(price_from_binance * multiplier));
    const quantityBigInt = BigInt(Math.round(lots * multiplier));

    const margin = Math.ceil((price_from_binance * lots) / levarage);
    const marginBigInt = BigInt(margin);

    const orderType = type === "ASK" ? "LONG" : "SHORT";

    try {
        const balance = await prisma.balance.findUnique({
            where: { userId: String(userId) }
        });

        if (!balance || balance.tradable < margin) {
            res.status(400).json({ message: "Insufficient balance" });
            return;
        }

        const order = await prisma.orders.create({
            data: {
                userId: String(userId),
                type: orderType,
                asset,
                price: priceBigInt,
                quantity: quantityBigInt,
                margin: marginBigInt,
                levarage,
                decimals,
                status: "OPEN",
            }
        });

        await prisma.balance.update({
            where: { userId: String(userId) },
            data: {
                tradable: balance.tradable - margin,
                locked: balance.locked + margin,
            }
        });

        res.status(200).json({ order });
    } catch (err) {
        console.error("Error placing trade:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}