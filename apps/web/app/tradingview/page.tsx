'use client'
import { useEffect } from "react";
import TradingViewNav from "../../src/components/navbar/TradingViewNav";
import TradingViewDashboard from "../../src/components/trade-view/TradingViewDashboard";
import { cn } from "../../src/lib/utils";
import { useTimeSeriesStore } from "../../src/store/useTimeSeriesStore";
import { useLiveTradingDataStore } from "../../src/store/useLiveTradingDataStore";
import axios from "axios";
import { useUserSessionStore } from "../../src/store/useUserSessionStore";
import { useUserDataStore } from "../../src/store/useUserDataStore";
import { useLivePricesStore } from "../../src/store/useLivePricesStore";
import TradeSocket from "../../src/socket/TradeSocket";
import { usePositionsStore } from "../../src/store/usePositionsStore";

export default function Page() {
    const { timeSeries } = useTimeSeriesStore();
    const { fetchCandles } = useLiveTradingDataStore();
    const { session } = useUserSessionStore();
    const { setUserData, userData } = useUserDataStore();
    const { selectedSymbol } = useLivePricesStore();
    const refreshPositions = usePositionsStore((s) => s.refresh);

    useEffect(() => {
        const token = session?.user?.token;
        if (!token) return;
        refreshPositions(token);
        // The server closes positions on its own (liquidation, stop loss, take profit), so keep in sync.
        const interval = setInterval(() => refreshPositions(token), 2000);
        return () => clearInterval(interval);
    }, [session?.user?.token, refreshPositions]);

    useEffect(() => {
        new TradeSocket();
        if (session?.user?.token) {
            async function getUserData() {
                try {
                    const { data } = await axios.get('http://localhost:4000/api/user', {
                        headers: {
                            Authorization: `Bearer ${session?.user?.token}`
                        }
                    });
                    setUserData(data.user);
                } catch (err) {
                    console.log(err);
                }
            }
            getUserData();
        }
    }, [session?.user?.token, setUserData]);

    useEffect(() => {
        fetchCandles(selectedSymbol, timeSeries);

        const interval = setInterval(() => {
            fetchCandles(selectedSymbol, timeSeries);
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchCandles, selectedSymbol, timeSeries]);
    console.log("user dta is : ", userData);

    return (
        <div className={cn("w-full h-screen flex flex-col gap-y-1 bg-[#3f464a]")}>
            <TradingViewNav />
            <TradingViewDashboard />
        </div>
    );
}