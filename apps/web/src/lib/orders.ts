import { LivePriceData } from "../store/useLivePricesStore";
import { Orders } from "../types/prisma-types";

export function liveProfit(order: Orders, price: LivePriceData | undefined): number | null {
    if (!price) return null;
    const bid = parseFloat(price.bidPrice);
    const ask = parseFloat(price.askPrice);
    if (!bid || !ask) return null;
    return order.type === "LONG"
        ? (bid - order.price) * order.lots
        : (order.price - ask) * order.lots;
}
