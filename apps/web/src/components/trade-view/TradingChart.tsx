'use client';
import { useEffect, useRef } from "react";
import axios from "axios";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CandlestickData,
  UTCTimestamp,
  CandlestickSeries,
  LineStyle,
} from "lightweight-charts";
import { useLiveTradingDataStore } from "../../store/useLiveTradingDataStore";
import { useLivePricesStore } from "../../store/useLivePricesStore";
import { useOrdersStore } from "../../store/useOrdersStore";
import { useUserSessionStore } from "../../store/useUserSessionStore";
import type { Orders } from "../../types/prisma-types";

const BACKEND_URL = "http://localhost:4000";

type LineField = "triggerPrice" | "stopLoss" | "takeProfit";

interface TrackedLine {
  priceLine: IPriceLine;
  orderId: string;
  field: LineField;
  price: number;
}

function orderLinesFor(order: Orders): { field: LineField; price: number; title: string; color: string }[] {
  const lines: { field: LineField; price: number; title: string; color: string }[] = [];

  if (order.status === "PENDING" && order.triggerPrice !== null) {
    const entryLabel = order.entryType === "LIMIT" ? "Limit" : "Stop";
    lines.push({
      field: "triggerPrice",
      price: order.triggerPrice,
      title: `${entryLabel} ${order.type === "LONG" ? "Buy" : "Sell"}`,
      color: "#ff9f0a",
    });
  }

  if (order.status === "OPEN") {
    if (order.stopLoss !== null) {
      lines.push({ field: "stopLoss", price: order.stopLoss, title: "Stop loss", color: "#eb483f" });
    }
    if (order.takeProfit !== null) {
      lines.push({ field: "takeProfit", price: order.takeProfit, title: "Take profit", color: "#22c55e" });
    }
  }

  return lines;
}

export default function DummyCandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { candles } = useLiveTradingDataStore();
  const { selectedSymbol } = useLivePricesStore();
  const { orders, fetchOrders } = useOrdersStore();
  const { session } = useUserSessionStore();

  const trackedLinesRef = useRef<TrackedLine[]>([]);
  const draggingRef = useRef<TrackedLine | null>(null);

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
      // free the chart surface for dragging order lines
      handleScroll: { pressedMouseMove: false },
      handleScale: { axisPressedMouseMove: false },
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
      trackedLinesRef.current = [];
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

  // (re)draw order lines whenever orders or the selected symbol change
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    if (draggingRef.current) return;

    for (const line of trackedLinesRef.current) {
      series.removePriceLine(line.priceLine);
    }
    trackedLinesRef.current = [];

    for (const order of orders) {
      if (order.asset !== selectedSymbol) continue;
      for (const spec of orderLinesFor(order)) {
        const priceLine = series.createPriceLine({
          price: spec.price,
          color: spec.color,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: spec.title,
        });
        trackedLinesRef.current.push({ priceLine, orderId: order.id, field: spec.field, price: spec.price });
      }
    }
  }, [orders, selectedSymbol]);

  function lineAt(y: number): TrackedLine | null {
    const series = seriesRef.current;
    if (!series) return null;
    for (const line of trackedLinesRef.current) {
      const lineY = series.priceToCoordinate(line.price);
      if (lineY !== null && Math.abs(lineY - y) <= 6) {
        return line;
      }
    }
    return null;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const series = seriesRef.current;
    if (!series || !chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const dragging = draggingRef.current;
    if (dragging) {
      const price = series.coordinateToPrice(y);
      if (price !== null && price > 0) {
        const snapped = Number(price.toFixed(2));
        if (snapped !== dragging.price) {
          const previousOptions = dragging.priceLine.options();
          series.removePriceLine(dragging.priceLine);
          dragging.priceLine = series.createPriceLine({
            price: snapped,
            color: previousOptions.color,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: previousOptions.title ?? "",
          });
          dragging.price = snapped;
          const tracked = trackedLinesRef.current.find(
            (l) => l.orderId === dragging.orderId && l.field === dragging.field
          );
          if (tracked) {
            tracked.priceLine = dragging.priceLine;
            tracked.price = snapped;
          }
        }
      }
      return;
    }

    const hovered = lineAt(y);
    chartContainerRef.current.style.cursor = hovered ? "ns-resize" : "default";
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hovered = lineAt(y);
    if (hovered) {
      draggingRef.current = hovered;
      chartContainerRef.current.style.cursor = "ns-resize";
    }
  }

  async function onPointerUp() {
    const dragging = draggingRef.current;
    draggingRef.current = null;
    if (!chartContainerRef.current) return;
    chartContainerRef.current.style.cursor = "default";
    if (!dragging || !session?.user?.token) return;

    const original = orders.find((o) => o.id === dragging.orderId);
    if (original && original[dragging.field] === dragging.price) return;

    try {
      await axios.patch(
        `${BACKEND_URL}/api/orders/${dragging.orderId}`,
        { [dragging.field]: dragging.price },
        { headers: { Authorization: `Bearer ${session.user.token}` } }
      );
      await fetchOrders(session.user.token);
    } catch (err) {
      console.error("failed to move order line:", err);
      await fetchOrders(session.user.token!);
    }
  }

  return (
    <div
      ref={chartContainerRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
