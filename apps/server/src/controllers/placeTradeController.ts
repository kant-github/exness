import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { serializeOrder } from "../utils/serializeOrder";

const trade_type = ['BID', 'ASK']

// Orders store price/quantity/margin as BigInt scaled by 10^PRICE_DECIMALS.
const PRICE_DECIMALS = 4;

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !trade_type.includes(type) || typeof lots !== "number" || lots <= 0) {
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

    // 1 lot = 1 unit of the asset, so the position is worth price * lots and
    // the margin to lock is that divided by the leverage. Balance columns are
    // whole USD, so round the locked amount up to never lock less than the
    // margin is worth.
    const margin_usd = (price_from_binance * lots) / levarage;
    const margin_to_lock = Math.ceil(margin_usd);

    try {
        const balance = await prisma.balance.findUnique({
            where: { userId: String(userId) }
        });
        if (!balance || balance.tradable < margin_to_lock) {
            res.status(400).json({ message: "Insufficient balance" });
            return;
        }

        const scale = 10 ** PRICE_DECIMALS;
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.orders.create({
                data: {
                    userId: String(userId),
                    type: type === "ASK" ? "LONG" : "SHORT",
                    asset,
                    price: BigInt(Math.round(price_from_binance * scale)),
                    quantity: BigInt(Math.round(lots * scale)),
                    margin: BigInt(Math.round(margin_usd * scale)),
                    levarage,
                    decimals: PRICE_DECIMALS,
                    status: "OPEN"
                }
            });

            const updatedBalance = await tx.balance.update({
                where: { userId: String(userId) },
                data: {
                    tradable: { decrement: margin_to_lock },
                    locked: { increment: margin_to_lock }
                }
            });

            return { order, balance: updatedBalance };
        });

        res.status(200).json({
            order: serializeOrder(result.order),
            balance: result.balance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
