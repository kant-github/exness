import { TradeType, useOpenBiddingStore } from "../../store/useOpenBiddingStore";
import Image from "next/image";
import { RxCross1 } from "react-icons/rx";
import { useLivePricesStore } from "../../store/useLivePricesStore";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { getCryptoImageUrl, getSymbolDisplayName } from "../trade-view/AssetRow";
import axios from "axios";
import { useUserSessionStore } from "../../store/useUserSessionStore";

export default function TradingBar() {
    const { tradeType, setTradeType } = useOpenBiddingStore();
    const { selectedSymbol, prices } = useLivePricesStore();
    const [lots, setLots] = useState(0.01);
    const { session } = useUserSessionStore();

    async function placeOrder() {
        try {
            if (!selectedSymbol) return;
            const { data } = await axios.post('http://localhost:7001/api/trade', {
                asset: selectedSymbol,
                type: tradeType,
                lots: lots,
                levarage: 1
            }, {
                headers: {
                    Authorization: `Bearer ${session?.user?.token}`
                }
            })
            console.log("data is : ", data);
        } catch (err) {
            console.error(err);
        }
    }

    function increment() {
        setLots(prev => +(prev + 0.01).toFixed(2));
    };

    function decrement() {
        setLots(prev => Math.max(0.01, +(prev - 0.01).toFixed(2)));
    };

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = parseFloat(e.target.value);
        if (value >= 0.01) {
            setLots(value);
        }
    };

    const priceData = prices[selectedSymbol];
    return (
        <>
            {tradeType && (
                <div className={cn("h-full w-[16rem] bg-neutral-900 rounded-tl-md p-3")}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start gap-x-2">
                            <Image
                                src={getCryptoImageUrl(selectedSymbol)}
                                alt={'symbol'}
                                width={14}
                                height={14}
                            />
                            <div className="text-neutral-100 text-[12px] tracking-wider font-thin">
                                {getSymbolDisplayName(selectedSymbol)}
                            </div>
                        </div>
                        <RxCross1 onClick={() => setTradeType(null)} className="text-neutral-100 cursor-pointer" size={15} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-1 w-full mt-4">
                        <div
                            onClick={() => setTradeType(TradeType.BID)}
                            className={cn(
                                "h-16  border border-[#eb483f] rounded-sm p-3 cursor-pointer",
                                tradeType === TradeType.BID && "bg-[#eb483f]"
                            )}
                        >
                            <div className={cn("text-[#eb483f]/70 text-xs font-thin tracking-wider", tradeType === TradeType.BID && "text-white")}>Sell</div>
                            <div className={cn("text-[#eb483f] text-xs font-thin tracking-wider mt-2", tradeType === TradeType.BID && "text-white")}>
                                {priceData?.bidPrice}
                            </div>
                        </div>

                        <div
                            onClick={() => setTradeType(TradeType.ASK)}
                            className={cn(
                                "h-16 border border-[#178bf9] rounded-sm p-3 cursor-pointer",
                                tradeType === TradeType.ASK && "bg-[#178bf9]"
                            )}
                        >
                            <div className={cn("text-[#178bf9]/70 text-xs font-thin tracking-wider", tradeType === TradeType.ASK && "text-white")}>Buy</div>
                            <div className={cn("text-[#178bf9] text-xs font-thin tracking-wider mt-2", tradeType === TradeType.ASK && "text-white")}>
                                {priceData?.askPrice}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div>
                            <div className="text-xs text-neutral-400 mb-1">Volume</div>
                            <div className="flex items-stretch bg-neutral-800 rounded-md border border-neutral-700 overflow-hidden">
                                <div className="flex-1 flex items-center">
                                    <input
                                        aria-label="volume-input"
                                        type="number"
                                        value={lots}
                                        onChange={handleInputChange}
                                        step={0.01}
                                        min={0.01}
                                        className="w-full bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none"
                                    />
                                    <span className="text-neutral-400 text-xs px-2">Lots</span>
                                </div>
                                <div className="flex">
                                    <button
                                        onClick={decrement}
                                        className="w-8 h-full bg-neutral-800 hover:bg-neutral-800/30 text-neutral-100 text-sm font-medium border-l border-neutral-600 flex items-center justify-center cursor-pointer"
                                        type="button"
                                    >
                                        −
                                    </button>
                                    <button
                                        onClick={increment}
                                        className="w-8 h-full bg-neutral-800 hover:bg-neutral-800/30 text-neutral-100 text-sm font-medium border-l border-neutral-600 flex items-center justify-center cursor-pointer"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2 mt-8">
                        <button
                            onClick={placeOrder}
                            type="button"
                            className={cn(
                                "text-neutral-300 text-xs w-full items-center py-2.5 rounded-sm cursor-pointer",
                                tradeType === TradeType.BID && "bg-[#eb483f]",
                                tradeType === TradeType.ASK && "bg-[#178bf9]"
                            )}
                        >
                            Confirm {tradeType === TradeType.BID ? 'Sell' : 'Buy'} {lots} Lots
                        </button>
                        <button onClick={() => setTradeType(null)} type="button" className="text-neutral-300 text-xs w-full items-center py-2.5 rounded-sm bg-neutral-800 cursor-pointer border border-neutral-700">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}