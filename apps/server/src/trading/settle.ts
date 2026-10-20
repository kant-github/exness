import prisma from "@repo/db/client";
import { computePnl, fromScaled, serializeOrder, toScaled } from "./settlement";

type OrderStatus = "OPEN" | "CLOSED" | "LIQUIDATED";

interface OrderRow {
  id: string;
  userId: string;
  type: "LONG" | "SHORT";
  asset: string;
  price: bigint;
  quantity: bigint;
  margin: bigint;
  status: OrderStatus;
}

// Closes an order at `exit_price` and settles the realized P/L into the
// balance: unlock the margin, credit the P/L (for LIQUIDATED the loss is
// capped at the margin, since that is all that was ever locked away).
export async function settleOrder(order: OrderRow, exit_price: number, status: "CLOSED" | "LIQUIDATED") {
  const entry_price = fromScaled(order.price);
  const quantity = fromScaled(order.quantity);
  const margin = fromScaled(order.margin);
  const raw_pnl = computePnl(order.type, entry_price, exit_price, quantity);
  const realized_pnl = status === "LIQUIDATED" ? Math.max(raw_pnl, -margin) : raw_pnl;

  // The amount locked at open was Math.round(margin); unlock the same figure.
  const lock_amount = Math.round(margin);
  const settled_pnl = Math.round(realized_pnl);

  const balance = await prisma.balance.findUnique({ where: { userId: order.userId } });
  if (!balance) {
    throw new Error("Balance not found for order owner");
  }

  const [updated_order, updated_balance] = await prisma.$transaction([
    prisma.orders.update({
      where: { id: order.id },
      data: { status, exitPrice: toScaled(exit_price), closedAt: new Date() },
    }),
    prisma.balance.update({
      where: { userId: order.userId },
      data: {
        locked: balance.locked - lock_amount,
        tradable: balance.tradable + lock_amount + settled_pnl,
        total: balance.total + settled_pnl,
      },
    }),
  ]);

  return { order: serializeOrder(updated_order), balance: updated_balance, pnl: realized_pnl };
}