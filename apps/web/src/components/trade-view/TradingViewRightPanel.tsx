import DummyCandleChart from "./TradingChart";
import { cn } from "../../lib/utils";
import MiniBar from "../navbar/MiniBar";
import { useOpenBiddingStore } from "../../store/useOpenBiddingStore";
import TradingBar from "../navbar/TradingBar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUserSessionStore } from "../../store/useUserSessionStore";
import { useOrdersStore } from "../../store/useOrdersStore";
import { getSymbolDisplayName } from "./AssetRow";
import { TradingSymbol } from "../../store/useLivePricesStore";

enum OrderType {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

function formatScaled(value: string, decimals: number) {
    return (Number(value) / 10 ** decimals).toString();
}

export default function TradingViewRightPanel() {
    const { tradeType } = useOpenBiddingStore();
    const [orderType, setOrderType] = useState<OrderType>(OrderType.OPEN);
    const { session } = useUserSessionStore();
    const { orders, setOrders } = useOrdersStore();

    useEffect(() => {
        const token = session?.user?.token;
        if (!token) return;
        let cancelled = false;

        async function fetchOrders() {
            try {
                const { data } = await axios.get('http://localhost:4000/api/trades', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!cancelled && data.orders) {
                    setOrders(data.orders);
                }
            } catch (err) {
                console.error(err);
            }
        }
        fetchOrders();

        return () => { cancelled = true; };
    }, [session?.user?.token, setOrders]);

    const visibleOrders = orders.filter((order) =>
        orderType === OrderType.OPEN ? order.status === 'OPEN' : order.status !== 'OPEN'
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
                    <div className="h-[calc(100%-3rem)] overflow-y-auto px-4">
                        {visibleOrders.length === 0 ? (
                            <div className="text-neutral-500 text-xs py-4 text-center">
                                No {orderType === OrderType.OPEN ? 'open' : 'closed'} orders
                            </div>
                        ) : (
                            visibleOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between py-2 border-b border-neutral-800 text-xs text-neutral-300">
                                    <div className="flex items-center gap-x-3">
                                        <span className="text-neutral-100">{getSymbolDisplayName(order.asset as TradingSymbol)}</span>
                                        <span className={cn(order.type === 'LONG' ? "text-[#178bf9]" : "text-[#eb483f]")}>
                                            {order.type}
                                        </span>
                                        <span>{formatScaled(order.quantity, order.decimals)} Lots</span>
                                        <span className="text-neutral-400">{order.levarage}x</span>
                                    </div>
                                    <div className="flex items-center gap-x-3">
                                        <span>@ {formatScaled(order.price, order.decimals)}</span>
                                        <span className="text-neutral-500">{new Date(order.createdAt).toLocaleString()}</span>
                                    </div>
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
