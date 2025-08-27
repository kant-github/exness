'use client';
import { useEffect } from "react";
import { 
    useLivePricesStore, 
    TradingSymbol, 
    PriceChangeDirection 
} from "../../store/useLivePricesStore";
import { useLiveTradingDataStore } from "../../store/useLiveTradingDataStore";
import { useTimeSeriesStore } from "../../store/useTimeSeriesStore";
import { cn } from "../../lib/utils";

interface InstrumentRowProps {
    symbol: TradingSymbol;
    isSelected: boolean;
    onClick: () => void;
}

const InstrumentRow = ({ symbol, isSelected, onClick }: InstrumentRowProps) => {
    const { prices } = useLivePricesStore();
    const priceData = prices[symbol];
    
    const getSymbolDisplayName = (symbol: TradingSymbol): string => {
        return symbol.replace('USDT', '/USDT');
    };

    const getPriceChangeColor = (direction: PriceChangeDirection, changePercent: string) => {
        const change = parseFloat(changePercent);
        if (change > 0) return 'text-green-400';
        if (change < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    const formatPrice = (price: string): string => {
        const numPrice = parseFloat(price);
        if (numPrice >= 1000) return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (numPrice >= 1) return numPrice.toFixed(4);
        return numPrice.toFixed(6);
    };

    const formatPercentage = (percent: string): string => {
        const num = parseFloat(percent);
        return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#1e2936] border-l-2",
                isSelected 
                    ? "bg-[#1e2936] border-l-blue-400" 
                    : "bg-transparent border-l-transparent hover:border-l-gray-600"
            )}
        >
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                        {getSymbolDisplayName(symbol)}
                    </span>
                    <div className={cn(
                        "w-1 h-1 rounded-full transition-colors duration-300",
                        priceData.direction === PriceChangeDirection.UP ? "bg-green-400" :
                        priceData.direction === PriceChangeDirection.DOWN ? "bg-red-400" :
                        "bg-gray-600"
                    )} />
                </div>
                <div className="text-xs text-gray-400">
                    Vol: {parseFloat(priceData.volume24h).toLocaleString(undefined, { 
                        maximumFractionDigits: 0 
                    })}
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                <div className={cn(
                    "font-mono text-sm font-medium transition-colors duration-200",
                    priceData.direction === PriceChangeDirection.UP ? "text-green-400" :
                    priceData.direction === PriceChangeDirection.DOWN ? "text-red-400" :
                    "text-white"
                )}>
                    ${formatPrice(priceData.price)}
                </div>
                <div className={cn(
                    "text-xs font-medium",
                    getPriceChangeColor(priceData.direction, priceData.changePercent24h)
                )}>
                    {formatPercentage(priceData.changePercent24h)}
                </div>
            </div>
        </div>
    );
};

export default function TradingViewLeftPanel() {
    const { 
        prices, 
        selectedSymbol, 
        isConnected, 
        initializeWebSocket, 
        disconnectWebSocket, 
        setSelectedSymbol,
        fetch24hStats 
    } = useLivePricesStore();
    
    const { fetchCandles } = useLiveTradingDataStore();
    const { timeSeries } = useTimeSeriesStore();

    // Initialize WebSocket and fetch initial data
    useEffect(() => {
        initializeWebSocket();
        fetch24hStats();

        return () => {
            disconnectWebSocket();
        };
    }, []);

    const handleSymbolSelect = async (symbol: TradingSymbol) => {
        setSelectedSymbol(symbol);
        // Fetch candles for the selected symbol
        await fetchCandles(symbol, timeSeries);
    };

    const tradingSymbols = Object.values(TradingSymbol);

    return (
        <div className="bg-[#141c23] rounded-tr-md p-4 h-full flex flex-col">
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

            <div className="flex-1 space-y-1 overflow-y-auto">
                {tradingSymbols.map((symbol) => (
                    <InstrumentRow
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
                    Last Update: {new Date(prices[selectedSymbol].lastUpdate).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}