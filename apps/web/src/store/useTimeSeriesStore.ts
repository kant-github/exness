import { create } from "zustand";

export enum TimeSeriesEnum {
    ONE_MINUTE = "1 minute",
    FIVE_MINUTES = "5 minutes",
    FIFTEEN_MINUTES = "15 minutes",
    ONE_HOUR = "1 hour",
    ONE_DAY = "24 hours",
}

interface TimeSeriesStoreProps {
    timeSeries: TimeSeriesEnum.ONE_MINUTE;
    setTimeSeries: (timeSeries: TimeSeriesEnum) => void;
}

export const useTimeSeriesStore = create<TimeSeriesStoreProps>((set) => ({
    timeSeries: TimeSeriesEnum.ONE_MINUTE,
    setTimeSeries: (timeSeries: TimeSeriesEnum) => set({ timeSeries }),
}))