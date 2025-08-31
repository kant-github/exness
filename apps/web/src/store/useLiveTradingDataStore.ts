import { create } from "zustand";
import axios from "axios";

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
        try {
            set({ candles: [] });

            const response = await axios.get("http://localhost:7001/api/candles", {
                params: {
                    symbol: asset,
                    interval,
                    limit: 100,
                },
            });

            set({ candles: response.data.candles });
        } catch (error) {
            console.error("Error fetching candles:", error);
        }
    },
}));
