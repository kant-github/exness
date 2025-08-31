import { Request, Response } from "express";
import { prices_of_assets } from "../prices/live_prices";

const trade_type = ['BID', 'ASK']

export default async function placeTradeController(req: Request, res: Response) {
    const { asset, type, lots, levarage } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
    }

    if (!asset || !trade_type.includes(type) || lots <= 0) {
        res.status(411).json({ message: "Incorrect inputs" });
    }

    if (![1, 5, 10, 20, 100].includes(levarage)) {
        res.status(411).json({ message: "Invalid leverage" });
    }

    console.log("req.body is : ", req.body);
    const asset_current_price = prices_of_assets.get(asset);
    if (!asset_current_price) {
        res.status(400).json({ message: "Price data not available for this asset" });
        return;
    }

    const price_from_binance = type === "BID" ? asset_current_price.bid : asset_current_price.ask;


    res.status(200);
}