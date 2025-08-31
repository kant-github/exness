import { useState } from "react";
import { useTimeSeriesStore } from "../../store/useTimeSeriesStore";
import Applogo from "../ui/Applogo";
import ProfileMenu from "../ui/ProfileMenu";
import TimeSeries from "../ui/TimeSeries";
import { useUserDataStore } from "../../store/useUserDataStore";
import DepositDropdown from "../ui/DepositDropdown";
import { useLivePricesStore } from "../../store/useLivePricesStore";
import { getCryptoImageUrl, getSymbolDisplayName } from "../trade-view/AssetRow";
import Image from "next/image";
import { cn } from "../../lib/utils";

export default function TradingViewNav() {
    const { timeSeries } = useTimeSeriesStore();
    const { userData } = useUserDataStore()
    const [openTimeSeriesDropdown, setOpenTimeSeriesDropdown] = useState<boolean>(false);
    const [openDepositDropdown, setOpenDepositDropdown] = useState<boolean>(false);
    const { selectedSymbol, prices } = useLivePricesStore();
    const asset = prices[selectedSymbol];

    return (
        <div className="w-full bg-neutral-900">
            <div className="flex items-center justify-between w-full px-4 py-2">
                <div className="flex items-center gap-x-12">
                    <Applogo className="text-[#ffde02]" />
                    {
                        <div className="flex items-center justify-start gap-x-2">
                            <Image
                                src={getCryptoImageUrl(selectedSymbol)}
                                alt={'symbol'}
                                width={30}
                                height={30}
                            />
                            <div className="text-neutral-100 text-md font-normal tracking-wide">
                                {getSymbolDisplayName(selectedSymbol)}
                            </div>
                        </div>
                    }
                </div>
                <div className="flex items-center justify-center gap-x-5">

                    <div className={cn(`bg-[#ffdd03]/10 cursor-pointer px-3 rounded-sm border-[1px] border-[#ffdd03]/80`)}>
                        <span className="text-[9px] font-thin tracking-wider text-neutral-900 bg-[#ffdd03]/80 px-1 py-0.5 rounded-xs">Demo</span>
                        <div className={cn("text-sm tracking-wider font-thin text-neutral-100 hover:bg-[#232e34] ")}>
                            {userData?.Balance?.total} USD
                        </div>
                    </div>
                    <div className="relative">
                        {openTimeSeriesDropdown && (<TimeSeries setOpenTimeSeriesDropdown={setOpenTimeSeriesDropdown} />)}
                        <button
                            onClick={() => setOpenTimeSeriesDropdown(prev => !prev)}
                            type="button"
                            className="text-neutral-300 text-xs hover:bg-neutral-700/60 bg-neutral-700/30 p-2 rounded-sm cursor-pointer w-[6rem]"
                        >
                            {timeSeries}
                        </button>
                    </div>
                    <ProfileMenu />
                    <button
                        onClick={() => setOpenDepositDropdown(prev => !prev)}
                        type="button"
                        className="text-sm tracking-wider font-thin text-neutral-100 hover:bg-[#232e34] cursor-pointer px-5 py-2 rounded-sm"
                    >
                        Deposit
                    </button>
                </div>
            </div>
            {openDepositDropdown && (<DepositDropdown setOpen={setOpenDepositDropdown} />)}
        </div>
    );
}
