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
import { useLiveTradingDataStore } from "../../store/useLiveTradingDataStore";

export default function DummyCandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { candles } = useLiveTradingDataStore();

  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;
    const chart: IChartApi = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#171717" },
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
        upColor: "#178bf9",
        downColor: "#eb483f",
        borderVisible: false,
        wickUpColor: "#178bf9",
        wickDownColor: "#eb483f",
      }
    );
    chartRef.current = chart;
    seriesRef.current = candleSeries;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !candles?.length) return;
    const data: CandlestickData[] = candles.map(candle => ({
      time: (new Date(candle.time).getTime() / 1000) as UTCTimestamp,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
    })).reverse();
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />;
}