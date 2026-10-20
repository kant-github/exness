'use client';
import { useEffect } from "react";
import { Orders } from "../../types/prisma-types";
import { useOrdersStore } from "../../store/useOrdersStore";
import { useLivePricesStore, TradingSymbol } from "../../store/useLivePricesStore";
import { getSymbolDisplayName } from "./AssetRow";

function formatMoney(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)} USD`;
}

function formatPrice(value: number) {
    return value >= 1000 ? value.toFixed(2) : value.toFixed(4);
}

// Unrealized P/L for an open order, from the live price stream:
// a LONG exits at the bid, a SHORT covers at the ask.
function livePnl(order: Orders, bid: number, ask: number): number | null {
    const exitPrice = order.type === "LONG" ? bid : ask;
    if (!exitPrice) return null;
    const diff = order.type === "LONG" ? exitPrice - order.price : order.price - exitPrice;
    return diff * order.quantity;
}

function OrderRow({ order, onClose }: { order: Orders; onClose: () => void }) {
    const { prices } = useLivePricesStore();
    const priceData = prices[order.asset];
    const isOpen = order.status === "OPEN";
    const pnl = isOpen
        ? livePnl(order, parseFloat(priceData?.bidPrice || "0"), parseFloat(priceData?.askPrice || "0"))
        : order.pnl;

    return (
        <div className="px-4 py-2 flex items-center justify-between border-b border-neutral-700/60">
            <div className="flex items-center gap-x-3 min-w-0">
                <div
                    className={`text-[11px] px-1.5 py-0.5 rounded-sm font-thin tracking-wider ${
                        order.type === "LONG" ? "bg-[#178bf9]/20 text-[#178bf9]" : "bg-[#eb483f]/20 text-[#eb483f]"
                    }`}
                >
                    {order.type === "LONG" ? "Buy" : "Sell"}
                </div>
                <div className="text-xs text-neutral-200 tracking-wide truncate">
                    {getSymbolDisplayName(order.asset as TradingSymbol)}
                </div>
                <div className="text-[11px] text-neutral-400">
                    {order.quantity} lots · x{order.levarage}
                </div>
                <div className="text-[11px] text-neutral-400">
                    Entry {formatPrice(order.price)}
                </div>
            </div>
            <div className="flex items-center gap-x-3">
                {order.status === "LIQUIDATED" && (
                    <div className="text-[11px] text-neutral-400 tracking-wider">Liquidated</div>
                )}
                <div className={`text-xs ${pnl != null ? (pnl >= 0 ? "text-green-500" : "text-red-500") : "text-neutral-400"}`}>
                    {pnl != null ? formatMoney(pnl) : "—"}
                </div>
                {isOpen && (
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-xs px-2 py-1 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer border border-neutral-700"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}

export default function OrdersTab({ orderType }: { orderType: "OPEN" | "CLOSED" }) {
    const { openOrders, closedOrders, fetchOrders, closeOrder } = useOrdersStore();

    useEffect(() => {
        // Poll so server-side liquidations show up without a manual refresh.
        fetchOrders(orderType);
        const interval = setInterval(() => fetchOrders(orderType), 5000);
        return () => clearInterval(interval);
    }, [orderType, fetchOrders]);

    const orders = orderType === "OPEN" ? openOrders : closedOrders;

    return (
        <div className="overflow-y-auto">
            {orders.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-xs text-neutral-500 tracking-wider">
                    No {orderType === "OPEN" ? "open" : "closed"} positions
                </div>
            ) : (
                orders.map((order) => (
                    <OrderRow key={order.id} order={order} onClose={() => closeOrder(order.id)} />
                ))
            )}
        </div>
    );
}