import { Request, Response } from "express";
import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { SCALING, computeMargin, serializeOrder, toScaled } from "../trading/settlement";

const trade_type = ['BID', 'ASK'];
const allowed_leverage = [1, 5, 10, 20, 100];

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!asset || !trade_type.includes(type) || typeof lots !== 'number' || lots <= 0) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    if (!allowed_leverage.includes(Number(levarage))) {
        res.status(411).json({ message: "Invalid leverage" });
        return;
    }

    const asset_current_price = prices_of_assets.get(asset);
    if (!asset_current_price) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    // BID (sell) opens a SHORT at the bid, ASK (buy) opens a LONG at the ask.
    const order_type = type === "BID" ? "SHORT" : "LONG";
    const entry_price = type === "BID" ? asset_current_price.bid : asset_current_price.ask;

    const margin = computeMargin(entry_price, lots, Number(levarage));
    // Balance columns are Int; round the locked amount once and use that
    // same figure when unlocking so locked + tradable stays consistent.
    const lock_amount = Math.round(margin);

    let balance = await prisma.balance.findUnique({ where: { userId: String(userId) } });
    if (!balance) {
        balance = await prisma.balance.create({ data: { userId: String(userId) } });
    }

    if (balance.tradable < lock_amount) {
        res.status(400).json({ message: "Insufficient balance" });
        return;
    }

    const [order, updated_balance] = await prisma.$transaction([
        prisma.orders.create({
            data: {
                userId: String(userId),
                type: order_type,
                asset,
                price: toScaled(entry_price),
                quantity: toScaled(lots),
                margin: toScaled(margin),
                levarage: Number(levarage),
                decimals: SCALING,
                status: 'OPEN',
            },
        }),
        prisma.balance.update({
            where: { userId: String(userId) },
            data: {
                tradable: balance.tradable - lock_amount,
                locked: balance.locked + lock_amount,
            },
        }),
    ]);

    res.status(201).json({ order: serializeOrder(order), balance: updated_balance });
}