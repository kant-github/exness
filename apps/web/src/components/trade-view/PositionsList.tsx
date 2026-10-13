import { useState } from "react";
import { cn } from "../../lib/utils";
import { formatSignedUsd, formatUsd, livePnlCents } from "../../lib/trading";
import { TradingSymbol, useLivePricesStore } from "../../store/useLivePricesStore";
import { usePositionsStore } from "../../store/usePositionsStore";
import { useUserSessionStore } from "../../store/useUserSessionStore";
import { Orders } from "../../types/prisma-types";
import { getSymbolDisplayName } from "./AssetRow";

const CLOSE_LABEL: Record<string, string> = {
    MANUAL: "Closed",
    STOP_LOSS: "Stop loss",
    TAKE_PROFIT: "Take profit",
    LIQUIDATION: "Liquidated",
};

function pnlClass(cents: number | null) {
    if (cents === null || cents === 0) return "text-neutral-300";
    return cents > 0 ? "text-[#178bf9]" : "text-[#eb483f]";
}

function OpenRow({ position }: { position: Orders }) {
    const priceData = useLivePricesStore((s) => s.prices[position.asset]);
    const closePosition = usePositionsStore((s) => s.closePosition);
    const token = useUserSessionStore((s) => s.session?.user?.token);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pnl = livePnlCents(position, priceData?.bidPrice, priceData?.askPrice);

    async function handleClose() {
        if (!token || busy) return;
        setBusy(true);
        setError(null);
        try {
            await closePosition(token, position.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not close position");
            setBusy(false);
        }
    }

    return (
        <tr className="border-b border-neutral-800 text-xs text-neutral-200">
            <td className="px-3 py-2">{getSymbolDisplayName(position.asset as TradingSymbol)}</td>
            <td className={cn("px-3 py-2", position.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]")}>
                {position.type === "LONG" ? "Buy" : "Sell"} {position.lots}
            </td>
            <td className="px-3 py-2">{position.price}</td>
            <td className="px-3 py-2">{position.type === "LONG" ? priceData?.bidPrice : priceData?.askPrice}</td>
            <td className="px-3 py-2 text-neutral-400">
                {position.stopLoss ?? "-"} / {position.takeProfit ?? "-"}
            </td>
            <td className="px-3 py-2">{formatUsd(position.margin)}</td>
            <td className={cn("px-3 py-2 font-medium", pnlClass(pnl))}>{pnl === null ? "--" : formatSignedUsd(pnl)}</td>
            <td className="px-3 py-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={handleClose}
                    className="rounded-sm bg-neutral-700 px-3 py-1 text-neutral-100 hover:bg-neutral-600 disabled:opacity-50 cursor-pointer"
                >
                    Close
                </button>
                {error && <div className="mt-1 text-[10px] text-[#eb483f]">{error}</div>}
            </td>
        </tr>
    );
}

function ClosedRow({ position }: { position: Orders }) {
    return (
        <tr className="border-b border-neutral-800 text-xs text-neutral-200">
            <td className="px-3 py-2">{getSymbolDisplayName(position.asset as TradingSymbol)}</td>
            <td className={cn("px-3 py-2", position.type === "LONG" ? "text-[#178bf9]" : "text-[#eb483f]")}>
                {position.type === "LONG" ? "Buy" : "Sell"} {position.lots}
            </td>
            <td className="px-3 py-2">{position.price}</td>
            <td className="px-3 py-2">{position.closePrice}</td>
            <td className="px-3 py-2 text-neutral-400">
                {position.status === "LIQUIDATED" ? "Liquidated" : CLOSE_LABEL[position.closeReason ?? "MANUAL"]}
            </td>
            <td className="px-3 py-2">{formatUsd(position.margin)}</td>
            <td className={cn("px-3 py-2 font-medium", pnlClass(position.pnl))}>
                {position.pnl === null ? "--" : formatSignedUsd(position.pnl)}
            </td>
        </tr>
    );
}

export default function PositionsList({ mode }: { mode: "open" | "closed" }) {
    const positions = usePositionsStore((s) => (mode === "open" ? s.open : s.closed));

    if (positions.length === 0) {
        return (
            <div className="flex h-full items-center justify-center py-8 text-xs text-neutral-500">
                {mode === "open" ? "No open positions" : "No closed positions"}
            </div>
        );
    }

    const headers =
        mode === "open"
            ? ["Symbol", "Type", "Open price", "Current price", "SL / TP", "Margin", "P&L (USD)", ""]
            : ["Symbol", "Type", "Open price", "Close price", "Result", "Margin", "P&L (USD)"];

    return (
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-neutral-800 text-[11px] font-thin text-neutral-400">
                    {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 font-thin">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {positions.map((p) =>
                    mode === "open" ? <OpenRow key={p.id} position={p} /> : <ClosedRow key={p.id} position={p} />,
                )}
            </tbody>
        </table>
    );
}
