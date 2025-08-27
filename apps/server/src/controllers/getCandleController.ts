import prisma from "@repo/db/client";
import { Request, Response } from "express";

const VIEW_MAP: Record<string, string> = {
    "1 minute": "trade_1m_cagg",
    "5 minutes": "trade_5m_cagg",
    "15 minutes": "trade_15m_cagg",
    "1 hour": "trade_60m_cagg",
    "24 hours": "trade_24h_cagg",
};

export const getCandles = async (req: Request, res: Response) => {
    try {
        const { symbol, interval, limit = 100 } = req.query;
        
        if (!symbol || !interval) {
            res.status(400).json({ error: "symbol and interval are required" });
            return;
        }
        
        const viewName = VIEW_MAP[interval as string];
        if (!viewName) {
            res.status(400).json({ error: "Invalid interval" });
            return;
        }
        
        const candles = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                time, open, high, low, close, quantity_total, volume, 
                trade_count::text as trade_count
            FROM ${viewName}
            WHERE symbol = $1
            ORDER BY time DESC
            LIMIT $2
        `, symbol, Number(limit));
        
        console.log("candles are : ", candles);
        res.json({ symbol, interval, candles });
        return;
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error", err });
        return;
    }
};