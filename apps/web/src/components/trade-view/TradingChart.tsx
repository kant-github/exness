'use client';
import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  CandlestickSeries,
} from "lightweight-charts";

export default function DummyCandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart: IChartApi = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#141c23" },
        textColor: "#D1D5DB",
      },
      grid: {
        vertLines: { color: "#2d3748" },
        horzLines: { color: "#2d3748" },
      },
      timeScale: {
        timeVisible: true,
        borderColor: "#485c7b",
      },
    });

    const candleSeries: ISeriesApi<"Candlestick"> = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#4ade80",
        downColor: "#f87171",
        borderVisible: false,
        wickUpColor: "#4ade80",
        wickDownColor: "#f87171",
      }
    );

    const data: CandlestickData[] = [
      { time: 1660665600 as UTCTimestamp, open: 100, high: 110, low: 90, close: 105 },
      { time: 1660752000 as UTCTimestamp, open: 105, high: 120, low: 100, close: 115 },
      { time: 1660838400 as UTCTimestamp, open: 115, high: 130, low: 110, close: 120 },
      { time: 1660924800 as UTCTimestamp, open: 120, high: 125, low: 115, close: 118 },
      { time: 1661011200 as UTCTimestamp, open: 118, high: 130, low: 117, close: 128 },
    ];

    candleSeries.setData(data);

    chart.timeScale().fitContent();

    // cleanup
    return () => chart.remove();
  }, []);

  return <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />;
}
