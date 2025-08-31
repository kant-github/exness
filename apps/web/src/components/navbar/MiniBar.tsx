import { useLivePricesStore } from "../../store/useLivePricesStore"
import { TradeType, useOpenBiddingStore } from "../../store/useOpenBiddingStore";

export default function MiniBar() {
    const { prices, selectedSymbol } = useLivePricesStore();
    const { setTradeType } = useOpenBiddingStore();
    const asset = prices[selectedSymbol];

    return (
        <div className="bg-neutral-900 rounded-tl-md rounded-md overflow-hidden h-10 flex items-center justify-end px-2" >
            <div className="flex flex-row gap-x-2 items-center w-fit">
                <div onClick={() => setTradeType(TradeType.BID)} className="rounded-xs bg-[#eb483f] px-2 py-1 text-[13px] text-neutral-100 cursor-pointer">
                    Sell {asset?.askPrice}
                </div>
                <div onClick={() => setTradeType(TradeType.ASK)} className="rounded-xs bg-[#138bf9] px-2 py-1 text-[13px] text-neutral-100 cursor-pointer">
                    Buy {asset?.bidPrice}
                </div>
            </div>
        </div>
    )
}