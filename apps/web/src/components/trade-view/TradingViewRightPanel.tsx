import DummyCandleChart from "./TradingChart";
import { cn } from "../../lib/utils";
import MiniBar from "../navbar/MiniBar";
import { useOpenBiddingStore } from "../../store/useOpenBiddingStore";
import TradingBar from "../navbar/TradingBar";
import { useState } from "react";
import { useOrdersStore } from "../../store/useOrdersStore";
import { useLivePricesStore } from "../../store/useLivePricesStore";
import { useUserSessionStore } from "../../store/useUserSessionStore";
import { Orders } from "../../types/prisma-types";

enum OrderType {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

function livePnl(order: Orders, bidPrice: number, askPrice: number) {
    const exit = order.type === "LONG" ? bidPrice : askPrice;
    if (!exit) return 0;
    const diff = order.type === "LONG" ? exit - order.price : order.price - exit;
    return Math.max(diff * order.lots, -order.margin);
}

function pnlClass(pnl: number) {
    return pnl >= 0 ? "text-[#178bf9]" : "text-[#eb483f]";
}

function OrdersTable({ orderType }: { orderType: OrderType }) {
    const { orders, closeOrder } = useOrdersStore();
    const { prices } = useLivePricesStore();
    const { session } = useUserSessionStore();
    const [closeError, setCloseError] = useState<string | null>(null);

    const isOpen = orderType === OrderType.OPEN;
    const rows = orders.filter(order => (order.status === "OPEN") === isOpen);

    async function handleClose(orderId: string) {
        if (!session?.user?.token) return;
        setCloseError(null);
        try {
            await closeOrder(session.user.token, orderId);
        } catch {
            setCloseError("Could not close the order");
        }
    }

    if (rows.length === 0) {
        return <div className="text-xs text-neutral-500 p-4">No {isOpen ? 'open' : 'closed'} orders</div>;
    }

    return (
        <div className="overflow-y-auto text-xs text-neutral-300">
            {closeError && <div className="text-[#eb483f] px-4 py-1">{closeError}</div>}
            <table className="w-full text-left">
                <thead className="text-neutral-500 font-thin">
                    <tr>
                        <th className="px-4 py-2 font-thin">Symbol</th>
                        <th className="px-2 py-2 font-thin">Side</th>
                        <th className="px-2 py-2 font-thin">Lots</th>
                        <th className="px-2 py-2 font-thin">Leverage</th>
                        <th className="px-2 py-2 font-thin">Open price</th>
                        {!isOpen && <th className="px-2 py-2 font-thin">Close price</th>}
                        <th className="px-2 py-2 font-thin">Margin</th>
                        <th className="px-2 py-2 font-thin">P/L (USD)</th>
                        <th className="px-2 py-2 font-thin">{isOpen ? '' : 'Status'}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(order => {
                        const live = prices[order.asset];
                        const pnl = isOpen
                            ? livePnl(order, parseFloat(live?.bidPrice ?? '0'), parseFloat(live?.askPrice ?? '0'))
                            : order.pnl ?? 0;
                        return (
                            <tr key={order.id} className="border-t border-neutral-800">
                                <td className="px-4 py-2">{order.asset}</td>
                                <td className="px-2 py-2">{order.type === "LONG" ? 'Buy' : 'Sell'}</td>
                                <td className="px-2 py-2">{order.lots}</td>
                                <td className="px-2 py-2">{order.levarage}x</td>
                                <td className="px-2 py-2">{order.price}</td>
                                {!isOpen && <td className="px-2 py-2">{order.closePrice}</td>}
                                <td className="px-2 py-2">{order.margin.toFixed(2)}</td>
                                <td className={cn("px-2 py-2", pnlClass(pnl))}>{pnl.toFixed(2)}</td>
                                <td className="px-2 py-2">
                                    {isOpen ? (
                                        <button onClick={() => handleClose(order.id)} type="button" className="px-3 py-1 rounded-sm bg-neutral-800 border border-neutral-700 cursor-pointer">Close</button>
                                    ) : (
                                        order.status === "LIQUIDATED" ? 'Liquidated' : 'Closed'
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function TradingViewRightPanel() {
    const { tradeType } = useOpenBiddingStore();
    const [orderType, setOrderType] = useState<OrderType>(OrderType.OPEN);

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
                    <OrdersTable orderType={orderType} />
                </div>
            </div>
            <TradingBar />
        </div>
    );
}
