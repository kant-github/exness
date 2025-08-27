import { create } from "zustand";

interface CandleData {
    time: string;
    open: string;
    high: string;
    low: string;
    close: string;
    quantity_total: string;
    volume: string;
    trade_count: string;
}

interface LiveTradingDataStoreProps {
    candles: CandleData[];
    fetchCandles: (asset: string, interval: string) => Promise<void>;
}

export const useLiveTradingDataStore = create<LiveTradingDataStoreProps>((set) => ({
    candles: [],

    fetchCandles: async (asset: string, interval: string) => {
        const response = await fetch(`http://localhost:7001/api/candles?symbol=${asset}&interval=${interval}&limit=100`);
        const data = await response.json();
        set({ candles: data.candles });
    }
}));