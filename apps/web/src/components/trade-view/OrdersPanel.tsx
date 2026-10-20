'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import type { Orders } from "../../types/prisma-types";
import { CLOSE_REASON_LABELS } from "../../types/prisma-types";
import { useOrdersStore } from "../../store/useOrdersStore";
import { useUserSessionStore } from "../../store/useUserSessionStore";
import { useLivePricesStore } from "../../store/useLivePricesStore";
import { cn } from "../../lib/utils";

const BACKEND_URL = "http://localhost:4000";

function pnlOf(order: Orders, closePrice: number): number {
    const diff = order.type === "LONG" ? closePrice - order.price : order.price - closePrice;
    return diff * order.quantity;
}

function LevelInput({
    label,
    value,
    onCommit,
    decimals,
}: {
    label: string;
    value: number | null;
    onCommit: (next: number | null) => void;
    decimals: number;
}) {
    const [draft, setDraft] = useState<string>(value !== null ? String(value) : "");

    useEffect(() => {
        setDraft(value !== null ? String(value) : "");
    }, [value]);

    function commit() {
        const trimmed = draft.trim();
        if (trimmed === "") {
            if (value !== null) onCommit(null);
            return;
        }
        const parsed = parseFloat(trimmed);
        if (Number.isFinite(parsed) && parsed > 0 && parsed !== value) {
            onCommit(parsed);
        } else {
            setDraft(value !== null ? String(value) : "");
        }
    }

    return (
        <label className="flex items-center gap-1 text-[10px] text-neutral-400">
            {label}
            <input
                aria-label={`${label} input`}
                type="number"
                step={Math.pow(10, -decimals)}
                value={draft}
                placeholder="—"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="w-16 bg-neutral-800 border border-neutral-700 rounded-sm px-1 py-0.5 text-[11px] text-neutral-100 outline-none focus:border-[#ffde02]"
            />
        </label>
    );
}

function useOrderApi() {
    const { session } = useUserSessionStore();
    const { fetchOrders } = useOrdersStore();

    async function call(method: "patch" | "post", path: string, body: Record<string, unknown>) {
        if (!session?.user?.token) return;
        try {
            await axios.request({
                method,
                url: `${BACKEND_URL}/api${path}`,
                data: body,
                headers: { Authorization: `Bearer ${session.user.token}` },
            });
            await fetchOrders(session.user.token);
        } catch (err) {
            console.error(err);
        }
    }

    return call;
}

function OpenOrderRow({ order }: { order: Orders }) {
    const { prices } = useLivePricesStore();
    const call = useOrderApi();
    const live = prices[order.asset];
    const liveClose = order.type === "LONG" ? parseFloat(live?.bidPrice || "0") : parseFloat(live?.askPrice || "0");
    const hasLive = liveClose > 0;
    const pnl = hasLive ? pnlOf(order, liveClose) : 0;

    return (
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-medium", order.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]")}>
                        {order.type === "LONG" ? "Buy" : "Sell"} {order.asset}
                    </span>
                    <span className="text-[10px] text-neutral-500">{order.quantity} @ {order.price}</span>
                </div>
                <div className="flex items-center gap-2">
                    <LevelInput
                        label="SL"
                        decimals={order.decimals}
                        value={order.stopLoss}
                        onCommit={(next) => call("patch", `/orders/${order.id}`, { stopLoss: next })}
                    />
                    <LevelInput
                        label="TP"
                        decimals={order.decimals}
                        value={order.takeProfit}
                        onCommit={(next) => call("patch", `/orders/${order.id}`, { takeProfit: next })}
                    />
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={cn("text-[11px] font-medium", pnl >= 0 ? "text-green-400" : "text-red-400")}>
                    {hasLive ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USD` : "…"}
                </span>
                <button
                    type="button"
                    onClick={() => call("post", `/orders/${order.id}/close`, {})}
                    className="text-[10px] text-neutral-300 bg-neutral-800 border border-neutral-600 rounded-sm px-2 py-0.5 cursor-pointer hover:bg-neutral-700"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

function PendingOrderRow({ order }: { order: Orders }) {
    const call = useOrderApi();
    const entryLabel = order.entryType === "LIMIT" ? "Limit" : "Stop";

    return (
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-medium", order.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]")}>
                        {entryLabel} {order.type === "LONG" ? "Buy" : "Sell"} {order.asset}
                    </span>
                    <span className="text-[10px] text-neutral-500">{order.quantity} lots</span>
                </div>
                <div className="flex items-center gap-2">
                    <LevelInput
                        label="Price"
                        decimals={order.decimals}
                        value={order.triggerPrice}
                        onCommit={(next) => call("patch", `/orders/${order.id}`, { triggerPrice: next })}
                    />
                    <LevelInput
                        label="SL"
                        decimals={order.decimals}
                        value={order.stopLoss}
                        onCommit={(next) => call("patch", `/orders/${order.id}`, { stopLoss: next })}
                    />
                    <LevelInput
                        label="TP"
                        decimals={order.decimals}
                        value={order.takeProfit}
                        onCommit={(next) => call("patch", `/orders/${order.id}`, { takeProfit: next })}
                    />
                </div>
            </div>
            <button
                type="button"
                onClick={() => call("post", `/orders/${order.id}/cancel`, {})}
                className="text-[10px] text-neutral-300 bg-neutral-800 border border-neutral-600 rounded-sm px-2 py-0.5 cursor-pointer hover:bg-neutral-700"
            >
                Cancel
            </button>
        </div>
    );
}

function ClosedOrderRow({ order }: { order: Orders }) {
    const rejected = order.status === "REJECTED";
    const cancelled = order.status === "CANCELLED";
    const closed = order.status === "CLOSED";

    const pnl =
        closed && order.closePrice !== null
            ? pnlOf(order, order.closePrice)
            : null;

    const reason = cancelled
        ? "Cancelled"
        : order.closeReason
            ? CLOSE_REASON_LABELS[order.closeReason] ?? order.closeReason
            : "";

    return (
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-medium", order.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]")}>
                        {order.type === "LONG" ? "Buy" : "Sell"} {order.asset}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                        {rejected || cancelled
                            ? `${order.entryType === "MARKET" ? "Market" : order.entryType === "LIMIT" ? "Limit" : "Stop"} order`
                            : `${order.quantity} @ ${order.price} → ${order.closePrice}`}
                    </span>
                </div>
                <div className="text-[10px] text-neutral-400">{reason}</div>
            </div>
            {pnl !== null && (
                <span className={cn("text-[11px] font-medium", pnl >= 0 ? "text-green-400" : "text-red-400")}>
                    {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} USD
                </span>
            )}
        </div>
    );
}

enum OrderTab {
    OPEN = "OPEN",
    PENDING = "PENDING",
    CLOSED = "CLOSED",
}

export default function OrdersPanel() {
    const { orders } = useOrdersStore();
    const [tab, setTab] = useState<OrderTab>(OrderTab.OPEN);

    const openOrders = orders.filter((o) => o.status === "OPEN");
    const pendingOrders = orders.filter((o) => o.status === "PENDING");
    const closedOrders = orders.filter((o) => o.status === "CLOSED" || o.status === "REJECTED" || o.status === "CANCELLED");

    const tabs: { key: OrderTab; label: string; count: number }[] = [
        { key: OrderTab.OPEN, label: "Open", count: openOrders.length },
        { key: OrderTab.PENDING, label: "Pending", count: pendingOrders.length },
        { key: OrderTab.CLOSED, label: "Closed", count: closedOrders.length },
    ];

    const visible =
        tab === OrderTab.OPEN ? openOrders : tab === OrderTab.PENDING ? pendingOrders : closedOrders;

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-neutral-700 h-12 px-4 flex items-center justify-between">
                <div className="h-full flex items-center justify-start gap-x-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            type="button"
                            className={cn(
                                "text-neutral-300 text-sm font-thin border-b-4 border-transparent h-full min-w-[4rem] cursor-pointer",
                                tab === t.key && "border-[#ffde02]"
                            )}
                        >
                            {t.label}
                            {t.count > 0 && <span className="ml-1 text-[10px] text-neutral-500">{t.count}</span>}
                        </button>
                    ))}
                </div>
                <div className="text-xs font-extralight text-neutral-400">ORDERS</div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {visible.length === 0 ? (
                    <div className="text-xs text-neutral-500 px-4 py-4">No orders here yet</div>
                ) : (
                    visible.map((order) => {
                        if (order.status === "OPEN") return <OpenOrderRow key={order.id} order={order} />;
                        if (order.status === "PENDING") return <PendingOrderRow key={order.id} order={order} />;
                        return <ClosedOrderRow key={order.id} order={order} />;
                    })
                )}
            </div>
        </div>
    );
}
