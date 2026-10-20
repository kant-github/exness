import DummyCandleChart from "./TradingChart";
import { cn } from "../../lib/utils";
import MiniBar from "../navbar/MiniBar";
import { useOpenBiddingStore } from "../../store/useOpenBiddingStore";
import TradingBar from "../navbar/TradingBar";
import OrdersPanel from "./OrdersPanel";

export default function TradingViewRightPanel() {
    const { tradeType } = useOpenBiddingStore();

    return (
        <div className="h-full flex flex-row gap-1">
            <div className="flex flex-col flex-1 bg-[#3f464a] gap-1">
                <MiniBar />
                <div className={cn("bg-neutral-900 rounded-tl-md rounded-bl-md overflow-hidden flex-1 max-h-[24rem]", tradeType && "rounded-md")}>
                    <DummyCandleChart key={tradeType || 'default'} />
                </div>
                <div className={cn("bg-neutral-900 rounded-tl-md overflow-hidden flex-1 max-h-[24rem]", tradeType && "rounded-t-md")}>
                    <OrdersPanel />
                </div>
            </div>
            <TradingBar />
        </div>
    );
}
