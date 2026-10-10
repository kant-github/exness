import DummyCandleChart from "./TradingChart";
import { cn } from "../../lib/utils";
import MiniBar from "../navbar/MiniBar";
import { useOpenBiddingStore } from "../../store/useOpenBiddingStore";
import TradingBar from "../navbar/TradingBar";
import { useState } from "react";
import { useUserDataStore } from "../../store/useUserDataStore";

enum OrderType {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

export default function TradingViewRightPanel() {
    const { tradeType } = useOpenBiddingStore();
    const [orderType, setOrderType] = useState<OrderType>(OrderType.OPEN);
    const { userData } = useUserDataStore();
    const orders = (userData?.Orders ?? []).filter(order =>
        orderType === OrderType.OPEN ? order.status === "OPEN" : order.status !== "OPEN"
    );

    return (
        <div className="h-full flex flex-row gap-1">
            <div className="flex flex-col flex-1 bg-[#3f464a] gap-1">
                <MiniBar />
                <div className={cn("bg-neutral-900 rounded-tl-md rounded-bl-md overflow-hidden flex-1 max-h-[24rem]", tradeType && "rounded-md")}>
                    <DummyCandleChart key={tradeType || 'default'} />
                </div>
                <div className={cn("bg-neutral-900 rounded-tl-md overflow-hidden flex-1 max-h-[24rem]", tradeType && "rounded-t-md")}>
                    <div className="border-b border-neutral-700 h-12 px-4 flex items-center justify-between">
                        <div className="h-full flex items-center justify-start gap-x-2 ">
                            <button onClick={() => setOrderType(OrderType.OPEN)} type="button" className={cn("text-neutral-300 text-sm font-thin border-b-4 border-transparent h-full min-w-[4rem] cursor-pointer", orderType === OrderType.OPEN && "border-[#ffde02]")}>Open</button>
                            <button onClick={() => setOrderType(OrderType.CLOSED)} type="button" className={cn("text-neutral-300 text-sm font-thin border-b-4 border-transparent h-full min-w-[4rem] cursor-pointer", orderType === OrderType.CLOSED && "border-[#ffde02]")}>Closed</button>
                        </div>
                        <div className="text-xs font-extralight text-neutral-400">
                            ORDERS
                        </div>
                    </div>
                    <div className="px-4 py-2 overflow-y-auto">
                        {orders.length === 0 ? (
                            <div className="text-neutral-500 text-xs font-thin py-4">
                                No {orderType === OrderType.OPEN ? 'open' : 'closed'} orders
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="grid grid-cols-5 items-center py-2 border-b border-neutral-800 text-xs font-thin text-neutral-300">
                                    <span>{order.asset}</span>
                                    <span className={cn(order.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]")}>
                                        {order.type === "LONG" ? "Buy" : "Sell"}
                                    </span>
                                    <span>{order.quantity} Lots</span>
                                    <span>{order.price}</span>
                                    <span className="text-right">{order.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <TradingBar />
        </div>
    );
}
