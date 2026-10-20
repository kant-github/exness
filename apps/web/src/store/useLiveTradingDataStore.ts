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

export const useLiveTradingDataStore = create<LiveTradingDataStoreProps>((set) => {
    let latestRequestId = 0;

    return {
        candles: [],

        fetchCandles: async (asset: string, interval: string) => {
            const requestId = ++latestRequestId;
            try {
                set({ candles: [] });

                const response = await axios.get("http://localhost:4000/api/candles", {
                    params: {
                        symbol: asset,
                        interval,
                        limit: 100,
                    },
                });

                if (requestId !== latestRequestId) return;

                set({ candles: response.data.candles });
            } catch (error) {
                console.error("Error fetching candles:", error);
            }
        },
    };
});
