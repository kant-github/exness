import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import {
    ALLOWED_LEVERAGE,
    PRICE_DECIMALS,
    entryPrice,
    lotsToQuantity,
    marginCents,
    sideFromTradeType,
    toScaledPrice,
} from "../trading/orderMath";
import { serializeOrder } from "../trading/orders";

const trade_type = ['BID', 'ASK']

class InsufficientFunds extends Error {}

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req.user?.id ? String(req.user.id) : null;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !trade_type.includes(type) || typeof lots !== "number" || !(lots >= 0.01)) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    if (!ALLOWED_LEVERAGE.includes(levarage)) {
        res.status(411).json({ message: "Invalid leverage" });
        return;
    }

    const asset_current_price = prices_of_assets.get(asset);
    if (!asset_current_price) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    const side = sideFromTradeType(type);
    const price = entryPrice(side, asset_current_price.bid, asset_current_price.ask);
    const margin = marginCents(price, lots, levarage);

    try {
        const order = await prisma.$transaction(async (tx) => {
            const locked = await tx.balance.updateMany({
                where: { userId, tradable: { gte: margin / 100 } },
                data: {
                    tradable: { decrement: margin / 100 },
                    locked: { increment: margin / 100 },
                },
            });
            if (locked.count === 0) throw new InsufficientFunds();

            return tx.orders.create({
                data: {
                    userId,
                    type: side,
                    asset,
                    price: toScaledPrice(price),
                    quantity: lotsToQuantity(lots),
                    margin: BigInt(margin),
                    levarage,
                    decimals: PRICE_DECIMALS,
                    status: "OPEN",
                },
            });
        });

        res.status(201).json({ order: serializeOrder(order) });
    } catch (err) {
        if (err instanceof InsufficientFunds) {
            res.status(400).json({ message: "Insufficient balance" });
            return;
        }
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
