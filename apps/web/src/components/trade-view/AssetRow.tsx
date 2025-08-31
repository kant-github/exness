import Image from "next/image";
import { PriceChangeDirection, TradingSymbol, useLivePricesStore } from "../../store/useLivePricesStore";
import { cn } from "../../lib/utils";
import { ChevronUp } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

export function getCryptoImageUrl(symbol: TradingSymbol): string {
    const baseCurrency = symbol.replace('USDT', '').toLowerCase();
    const logoUrls: Record<string, string> = {
        'btc': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        'eth': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        'bnb': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
        'xrp': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
        'ada': 'https://assets.coingecko.com/coins/images/975/small/cardano.png'
    };
    return logoUrls[baseCurrency] || '';
}

export function getSymbolDisplayName(symbol: TradingSymbol): string {
    return symbol.replace('USDT', '/USDT');
}

interface AssetRowProps {
    symbol: TradingSymbol;
    isSelected: boolean;
    onClick: () => void;
}

export default function AssetRow({ symbol, isSelected, onClick }: AssetRowProps) {
    const { prices } = useLivePricesStore();
    const priceData = prices[symbol];





    return (
        <div
            onClick={onClick}
            className={cn(
                "grid gap-x-2 cursor-pointer py-1 px-2 rounded-xs",
                isSelected && "bg-neutral-800"
            )}
            style={{ gridTemplateColumns: '1fr 40px 1fr 1fr' }}
        >
            <div className="flex items-center justify-start gap-x-2">
                <div>
                    <Image
                        src={getCryptoImageUrl(symbol)}
                        alt={getSymbolDisplayName(symbol)}
                        width={14}
                        height={14}
                    />
                </div>
                <div className="text-neutral-100 text-[12px] tracking-wider font-thin">
                    {getSymbolDisplayName(symbol)}
                </div>
            </div>

            <div className="flex items-center justify-center">
                {priceData?.direction === PriceChangeDirection.UP && (
                    <ChevronUp className="text-black bg-green-500 rounded-xs p-1" size={18} />
                )}
                {priceData?.direction === PriceChangeDirection.DOWN && (
                    <ChevronDown className="text-white bg-[#eb483f] rounded-xs p-1" size={18} />
                )}
            </div>

            <div className="flex items-center justify-start">
                <div className={cn(
                    "text-xs text-white rounded-xs px-3 py-1 w-full text-center",
                    priceData?.direction === PriceChangeDirection.UP && "bg-green-500 text-black",
                    priceData?.direction === PriceChangeDirection.DOWN && "bg-[#eb483f] text-white"
                )}>
                    {priceData?.askPrice}
                </div>
            </div>

            <div className="flex items-center justify-start">
                <div className={cn(
                    "text-xs text-white rounded-xs px-3 py-1 w-full text-center",
                    priceData?.direction === PriceChangeDirection.UP && "bg-green-500 text-black",
                    priceData?.direction === PriceChangeDirection.DOWN && "bg-[#eb483f] text-white"
                )}>
                    {priceData?.bidPrice}
                </div>
            </div>
        </div>
    )
}