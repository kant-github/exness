import { Request, Response } from "express";
import { prices_of_assets } from "../prices/live_prices";
import prisma from "@repo/db/client";
import { serializeOrder, PRICE_DECIMALS } from "../lib/serializeOrder";

const trade_type = ['BID', 'ASK']

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !trade_type.includes(type) || !(lots > 0)) {
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
    const margin = Math.ceil((price_from_binance * lots) / levarage);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId: String(userId) }
            });
            if (!balance || balance.tradable < margin) {
                return null;
            }

            const order = await tx.orders.create({
                data: {
                    userId: String(userId),
                    type: type === "ASK" ? "LONG" : "SHORT",
                    asset,
                    price: BigInt(Math.round(price_from_binance * 10 ** PRICE_DECIMALS)),
                    quantity: BigInt(Math.round(lots * 10 ** PRICE_DECIMALS)),
                    margin: BigInt(margin),
                    levarage,
                    decimals: PRICE_DECIMALS,
                    status: "OPEN",
                }
            });

            const updatedBalance = await tx.balance.update({
                where: { userId: String(userId) },
                data: {
                    tradable: { decrement: margin },
                    locked: { increment: margin },
                }
            });

            return { order, balance: updatedBalance };
        });

        if (!result) {
            res.status(400).json({ message: "Insufficient balance" });
            return;
        }

        res.status(200).json({
            order: serializeOrder(result.order),
            balance: result.balance,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
}
