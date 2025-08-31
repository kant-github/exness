'use client';
import { useLiveTradingDataStore } from "../../store/useLiveTradingDataStore";
import { useTimeSeriesStore } from "../../store/useTimeSeriesStore";
import { cn } from "../../lib/utils";
import { PriceChangeDirection, TradingSymbol, useLivePricesStore } from "../../store/useLivePricesStore";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

interface InstrumentRowProps {
    symbol: TradingSymbol;
    isSelected: boolean;
    onClick: () => void;
}

function InstrumentRow({ symbol, isSelected, onClick }: InstrumentRowProps) {
    const { prices } = useLivePricesStore();
    const priceData = prices[symbol];

    // Debounced state for visual updates
    const [displayData, setDisplayData] = useState(priceData);
    const [flashType, setFlashType] = useState<'none' | 'up' | 'down'>('none');
    const debounceRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!priceData) return;

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Determine if significant change occurred
        const shouldUpdate = !displayData ||
            Math.abs(parseFloat(priceData.askPrice) - parseFloat(displayData.askPrice)) > parseFloat(displayData.askPrice) * 0.001 ||
            Math.abs(parseFloat(priceData.bidPrice) - parseFloat(displayData.bidPrice)) > parseFloat(displayData.bidPrice) * 0.001;

        if (shouldUpdate) {
            // Show flash effect
            if (displayData) {
                const askChange = parseFloat(priceData.askPrice) - parseFloat(displayData.askPrice);
                setFlashType(askChange > 0 ? 'up' : askChange < 0 ? 'down' : 'none');

                // Clear flash after animation
                setTimeout(() => setFlashType('none'), 300);
            }

            // Debounce the update
            debounceRef.current = setTimeout(() => {
                setDisplayData(priceData);
            }, 100);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [priceData, displayData]);

    if (!displayData) return null;

    const getSymbolDisplayName = (symbol: TradingSymbol): string => {
        return symbol.replace('USDT', '/USDT');
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

    const getPriceChangeColor = (direction: PriceChangeDirection) => {
        if (direction === PriceChangeDirection.UP) return 'text-green-400';
        if (direction === PriceChangeDirection.DOWN) return 'text-red-400';
        return 'text-gray-300';
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "grid grid-cols-4 gap-2 p-2 cursor-pointer transition-all duration-200 border-b border-gray-700/30",
                "hover:bg-[#1e2936] text-xs font-medium",
                isSelected && "bg-[#1e2936] border-blue-500/30",
                flashType === 'up' && "bg-green-400/10",
                flashType === 'down' && "bg-red-400/10"
            )}
        >
            {/* Symbol Column - Fixed width */}
            <div className="flex items-center justify-start min-w-0 w-20">
                <div className="flex items-center gap-1">
                    <span className="text-neutral-100 font-medium text-xs truncate">
                        {getSymbolDisplayName(symbol)}
                    </span>
                    <div
                        className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500",
                            displayData.direction === PriceChangeDirection.UP
                                ? "bg-green-400"
                                : displayData.direction === PriceChangeDirection.DOWN
                                    ? "bg-red-400"
                                    : "bg-gray-500"
                        )}
                    />
                </div>
            </div>

            {/* Direction Indicator Column */}
            <div className="flex items-center justify-center w-6">
                {displayData.direction === PriceChangeDirection.UP && (
                    <FaChevronUp className="text-green-400" size={12} />
                )}
                {displayData.direction === PriceChangeDirection.DOWN && (
                    <FaChevronDown className="text-red-400" size={12} />
                )}
            </div>

            {/* Ask Price Column - Fixed width */}
            <div className="flex items-center justify-end w-24">
                <span className={cn(
                    "font-mono text-xs transition-colors duration-300",
                    getPriceChangeColor(displayData.direction)
                )}>
                    {formatPrice(displayData.askPrice)}
                </span>
            </div>

            {/* Bid Price Column - Fixed width */}
            <div className="flex items-center justify-end w-24">
                <span className={cn(
                    "font-mono text-xs transition-colors duration-300",
                    getPriceChangeColor(displayData.direction)
                )}>
                    {formatPrice(displayData.bidPrice)}
                </span>
            </div>
        </div>
    );
}

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
        <div className="bg-[#141c23] rounded-tr-md p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-extralight text-neutral-400 uppercase tracking-wider">
                    INSTRUMENTS
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-colors duration-500",
                        isConnected ? "bg-green-400" : "bg-red-400"
                    )} />
                    <span className="text-xs text-gray-500 font-medium">
                        {isConnected ? "Live" : "Offline"}
                    </span>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 p-2 border-b border-gray-600 mb-2">
                <div className="text-xs font-medium text-gray-400 w-20">Symbol</div>
                <div className="text-xs font-medium text-gray-400 w-6 text-center">Dir</div>
                <div className="text-xs font-medium text-gray-400 w-24 text-right">Ask</div>
                <div className="text-xs font-medium text-gray-400 w-24 text-right">Bid</div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-0">
                    {tradingSymbols.map((symbol) => (
                        <AssetRow
                            key={symbol}
                            symbol={symbol}
                            isSelected={selectedSymbol === symbol}
                            onClick={() => handleSymbolSelect(symbol)}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-500 text-center font-medium">
                    Selected: {selectedSymbol.replace('USDT', '/USDT')}
                </div>
                <div className="text-xs text-gray-600 text-center mt-1">
                    Last Update: {new Date(prices[selectedSymbol]?.lastUpdate || Date.now()).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}