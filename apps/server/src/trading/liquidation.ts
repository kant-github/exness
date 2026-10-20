import prisma from "@repo/db/client";
import { prices_of_assets } from "../prices/live_prices";
import { computePnl, fromScaled } from "./settlement";
import { settleOrder } from "./settle";

// Checks every OPEN order on `symbol` against the current live price and
// liquidates the ones whose loss has reached their locked margin.
export async function liquidationCheck(symbol: string): Promise<number> {
    const open_orders = await prisma.orders.findMany({
        where: { asset: symbol, status: "OPEN" },
    });

    const price_data = prices_of_assets.get(symbol);
    if (!price_data) return 0;

    let liquidated = 0;
    for (const order of open_orders) {
        const entry_price = fromScaled(order.price);
        const quantity = fromScaled(order.quantity);
        const margin = fromScaled(order.margin);

        // A LONG is marked against the bid, a SHORT against the ask.
        const market_price = order.type === "LONG" ? price_data.bid : price_data.ask;
        const pnl = computePnl(order.type, entry_price, market_price, quantity);

        if (pnl <= -margin) {
            // The position is closed at the price where the loss equals the
            // margin: everything that was locked away is lost, no more.
            const effective_exit =
                order.type === "LONG"
                    ? entry_price - margin / quantity
                    : entry_price + margin / quantity;
            await settleOrder(order, effective_exit, "LIQUIDATED");
            liquidated++;
        }
    }
    return liquidated;
}