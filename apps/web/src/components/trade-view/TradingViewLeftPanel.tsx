'use client';
import { useLiveTradingDataStore } from "../../store/useLiveTradingDataStore";
import { useTimeSeriesStore } from "../../store/useTimeSeriesStore";
import { cn } from "../../lib/utils";
import { TradingSymbol, useLivePricesStore } from "../../store/useLivePricesStore";
import AssetRow from "./AssetRow";

export default function TradingViewLeftPanel() {
    const {
        prices,
        selectedSymbol,
        isConnected,
        setSelectedSymbol
    } = useLivePricesStore();
    const { fetchCandles } = useLiveTradingDataStore();
    const { timeSeries } = useTimeSeriesStore();

    const handleSymbolSelect = async (symbol: TradingSymbol) => {
        setSelectedSymbol(symbol);
        await fetchCandles(symbol, timeSeries);
    };

    const tradingSymbols = Object.values(TradingSymbol);

    return (
        <div className="bg-neutral-900 rounded-tr-md p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-extralight text-neutral-400">
                    INSTRUMENTS
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-colors duration-300",
                        isConnected ? "bg-green-400" : "bg-red-400"
                    )} />
                    <span className="text-xs text-gray-500">
                        {isConnected ? "Live" : "Offline"}
                    </span>
                </div>
            </div>

            <div className="grid p-2 border-b border-gray-600 mb-2" style={{ gridTemplateColumns: '1fr 40px 1fr 1fr' }}>
                <div className="text-xs font-medium text-gray-400">Symbol</div>
                <div className="text-xs font-medium text-gray-400 text-center">Dir</div>
                <div className="text-xs font-medium text-gray-400 text-center">Ask</div>
                <div className="text-xs font-medium text-gray-400 text-center">Bid</div>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto flex flex-col gap-y-4">
                {tradingSymbols.map((symbol) => (
                    <AssetRow
                        key={symbol}
                        symbol={symbol}
                        isSelected={selectedSymbol === symbol}
                        onClick={() => handleSymbolSelect(symbol)}
                    />
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-500 text-center">
                    Selected: {selectedSymbol.replace('USDT', '/USDT')}
                </div>
                <div className="text-xs text-gray-600 text-center mt-1">
                    Last Update: {new Date(prices[selectedSymbol]?.lastUpdate || Date.now()).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}