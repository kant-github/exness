'use client'

import TradingViewNav from "../../src/components/navbar/TradingViewNav";
import TradingViewDashboard from "../../src/components/trade-view/TradingViewDashboard";
import { cn } from "../../src/lib/utils";
import TradeSocket from "../../src/socket/TradeSocket"

export default function Page() {
    // new TradeSocket();
    return (
        <div className={cn("w-full h-screen flex flex-col gap-y-1 bg-[#3f464a]")}>
            <TradingViewNav />
            <TradingViewDashboard />
        </div>
    )
}