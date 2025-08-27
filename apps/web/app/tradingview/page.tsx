'use client'
import { useEffect } from "react";
import TradingViewNav from "../../src/components/navbar/TradingViewNav";
import TradingViewDashboard from "../../src/components/trade-view/TradingViewDashboard";
import { cn } from "../../src/lib/utils";
import { useTimeSeriesStore } from "../../src/store/useTimeSeriesStore";
import { useLiveTradingDataStore } from "../../src/store/useLiveTradingDataStore";

export default function Page() {
    const { timeSeries } = useTimeSeriesStore();
    const { fetchCandles } = useLiveTradingDataStore();

    useEffect(() => {
        fetchCandles('BTCUSDT', timeSeries);
    }, [fetchCandles, timeSeries]);

    console.log("hey");

    return (
        <div className={cn("w-full h-screen flex flex-col gap-y-1 bg-[#3f464a]")}>
            <TradingViewNav />
            <TradingViewDashboard />
        </div>
    )
}