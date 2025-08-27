import { useEffect, useRef } from "react";
import { TimeSeriesEnum, useTimeSeriesStore } from "../../store/useTimeSeriesStore";
import { useLiveTradingDataStore } from "../../store/useLiveTradingDataStore";

interface TimeSeriesProps {
    setOpenTimeSeriesDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TimeSeries({ setOpenTimeSeriesDropdown }: TimeSeriesProps) {
    const { timeSeries, setTimeSeries } = useTimeSeriesStore();
    const timeSeriesDropdownRef = useRef<HTMLDivElement>(null);
    const { fetchCandles } = useLiveTradingDataStore()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (timeSeriesDropdownRef.current && !timeSeriesDropdownRef.current.contains(event.target as Node)) {
                setOpenTimeSeriesDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [setOpenTimeSeriesDropdown]);

    const handleSelectTimeSeries = (ts: TimeSeriesEnum) => {
        setTimeSeries(ts);
        setOpenTimeSeriesDropdown(false);
        fetchCandles('BTCUSDT', timeSeries);
    };

    return (
        <div ref={timeSeriesDropdownRef} className="absolute top-full right-0 w-[6rem] bg-[#2c3337] rounded-md shadow-lg z-50">
            <div>
                <button
                    onClick={() => handleSelectTimeSeries(TimeSeriesEnum.ONE_MINUTE)}
                    type="button"
                    className="text-neutral-300 text-xs hover:bg-neutral-700/30 px-1 py-1.5 rounded-sm w-full flex items-center justify-start pl-4"
                >
                    1 minute
                </button>
                <button
                    onClick={() => handleSelectTimeSeries(TimeSeriesEnum.FIVE_MINUTES)}
                    type="button"
                    className="text-neutral-300 text-xs hover:bg-neutral-700/30 px-1 py-1.5 rounded-sm w-full flex items-center justify-start pl-4"
                >
                    5 minute
                </button>
                <button
                    onClick={() => handleSelectTimeSeries(TimeSeriesEnum.FIFTEEN_MINUTES)}
                    type="button"
                    className="text-neutral-300 text-xs hover:bg-neutral-700/30 px-1 py-1.5 rounded-sm w-full flex items-center justify-start pl-4"
                >
                    15 minute
                </button>
                <button
                    onClick={() => handleSelectTimeSeries(TimeSeriesEnum.ONE_HOUR)}
                    type="button"
                    className="text-neutral-300 text-xs hover:bg-neutral-700/30 px-1 py-1.5 rounded-sm w-full flex items-center justify-start pl-4"
                >
                    1 hour
                </button>
                <button
                    onClick={() => handleSelectTimeSeries(TimeSeriesEnum.ONE_DAY)}
                    type="button"
                    className="text-neutral-300 text-xs hover:bg-neutral-700/30 px-1 py-1.5 rounded-sm w-full flex items-center justify-start pl-4"
                >
                    24 hours
                </button>
            </div>
        </div>
    )
}