import DummyCandleChart from "./TradingChart";
import { cn } from "../../lib/utils";
import MiniBar from "../navbar/MiniBar";
import { useOpenBiddingStore } from "../../store/useOpenBiddingStore";
import TradingBar from "../navbar/TradingBar";
import { useState } from "react";
import axios from "axios";
import { useOrdersStore } from "../../store/useOrdersStore";
import { useLivePricesStore } from "../../store/useLivePricesStore";
import { useUserSessionStore } from "../../store/useUserSessionStore";
import { useUserDataStore } from "../../store/useUserDataStore";
import { closeOrderUrl } from "../../routes/api_routes";
import { liveProfit } from "../../lib/orders";
import { Orders } from "../../types/prisma-types";

enum OrderType {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

export default function TradingViewRightPanel() {
    const { tradeType } = useOpenBiddingStore();
    const [orderType, setOrderType] = useState<OrderType>(OrderType.OPEN);
    const { orders, upsertOrder } = useOrdersStore();
    const { prices } = useLivePricesStore();
    const { session } = useUserSessionStore();
    const { setUserData } = useUserDataStore();

    const visibleOrders = orders.filter((order) => (orderType === OrderType.OPEN) === (order.status === "OPEN"));

    async function closeOrder(order: Orders) {
        try {
            const { data } = await axios.post(closeOrderUrl(order.id), {}, {
                headers: { Authorization: `Bearer ${session?.user?.token}` }
            });
            upsertOrder(data.order);
            if (data.balance) setUserData({ Balance: data.balance });
        } catch (err) {
            console.error(err);
        }
    }

    function formatProfit(value: number | null) {
        if (value === null) return '--';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
    }

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
                    <div className="overflow-y-auto max-h-[18rem]">
                        {visibleOrders.length === 0 && (
                            <div className="text-xs text-neutral-500 px-4 py-6">No {orderType === OrderType.OPEN ? 'open' : 'closed'} orders</div>
                        )}
                        {visibleOrders.map((order) => {
                            const isOpen = order.status === "OPEN";
                            const profit = isOpen ? liveProfit(order, prices[order.asset]) : order.pnl;
                            return (
                                <div key={order.id} className="grid grid-cols-7 items-center gap-x-2 px-4 py-2 border-b border-neutral-800 text-xs text-neutral-300">
                                    <span>{order.asset}</span>
                                    <span className={order.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]"}>{order.type === "LONG" ? "Buy" : "Sell"} {order.lots}</span>
                                    <span>1:{order.levarage}</span>
                                    <span>{order.price}</span>
                                    <span>{isOpen ? prices[order.asset]?.price : order.closePrice}</span>
                                    <span className={cn(profit !== null && profit >= 0 ? "text-[#178bf9]" : "text-[#eb483f]")}>
                                        {formatProfit(profit)}{order.status === "LIQUIDATED" && " (liquidated)"}
                                    </span>
                                    {isOpen ? (
                                        <button onClick={() => closeOrder(order)} type="button" className="bg-neutral-800 border border-neutral-700 rounded-sm py-1 cursor-pointer hover:bg-neutral-700">Close</button>
                                    ) : <span />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <TradingBar />
        </div>
    );
}
