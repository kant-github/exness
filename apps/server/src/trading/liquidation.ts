import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { exitPrice, fromScaledPrice, isLiquidated, pnlCents, quantityToLots } from "./orderMath";
import { settleOrder } from "./orders";

const CHECK_INTERVAL_MS = 1000;
const lastChecked = new Map<string, number>();
const inFlight = new Set<string>();

export async function liquidateLosingOrders(symbol: string) {
    const now = Date.now();
    if (inFlight.has(symbol) || now - (lastChecked.get(symbol) ?? 0) < CHECK_INTERVAL_MS) return;
    const price = prices_of_assets.get(symbol);
    if (!price) return;

    lastChecked.set(symbol, now);
    inFlight.add(symbol);
    try {
        const openOrders = await prisma.orders.findMany({ where: { asset: symbol, status: "OPEN" } });
        for (const order of openOrders) {
            const exit = exitPrice(order.type, price.bid, price.ask);
            const entry = fromScaledPrice(order.price, order.decimals);
            const pnl = pnlCents(order.type, entry, exit, quantityToLots(order.quantity));
            if (!isLiquidated(pnl, Number(order.margin))) continue;
            await prisma.$transaction((tx) => settleOrder(tx, order, price.bid, price.ask));
        }
    } catch (err) {
        console.error("Liquidation check failed for", symbol, err);
    } finally {
        inFlight.delete(symbol);
    }
}
