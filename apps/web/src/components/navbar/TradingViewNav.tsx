import { useState } from "react";
import { useTimeSeriesStore } from "../../store/useTimeSeriesStore";
import Applogo from "../ui/Applogo";
import ProfileMenu from "../ui/ProfileMenu";
import TimeSeries from "../ui/TimeSeries";

export default function TradingViewNav() {
    const { timeSeries } = useTimeSeriesStore();
    const [openTimeSeriesDropdown, setOpenTimeSeriesDropdown] = useState<boolean>(false);

    return (
        <div className="w-full bg-[#141c23]">
            <div className="flex items-center justify-between w-full px-4 py-2">
                <Applogo className="text-[#ffde02]" />
                <div className="flex items-center justify-center gap-x-5">
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
                        type="button"
                        className="text-neutral-300 bg-[#232e34] rounded-[6px] px-2 py-1.5 tracking-wide w-[8rem] border border-transparent hover:border-neutral-200 transition-colors duration-300"
                    >
                        Deposit
                    </button>
                </div>
            </div>
        </div>
    );
}
