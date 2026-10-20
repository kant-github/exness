// Shared trading math. Prices/quantities are stored as BigInt scaled by
// 10^SCALING (decimals column), so fractional lots/prices survive BigInt columns.

export const SCALING = 8;

export type OrderSide = "LONG" | "SHORT";

export function toScaled(value: number): bigint {
  return BigInt(Math.round(value * 10 ** SCALING));
}

export function fromScaled(value: bigint): number {
  return Number(value) / 10 ** SCALING;
}

export function computeMargin(entryPrice: number, lots: number, leverage: number): number {
  return (entryPrice * lots) / leverage;
}

export function computePnl(side: OrderSide, entryPrice: number, exitPrice: number, lots: number): number {
  const diff = side === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
  return diff * lots;
}

export interface SerializedOrder {
  id: string;
  userId: string;
  type: OrderSide;
  asset: string;
  price: number;
  quantity: number;
  margin: number;
  levarage: number;
  status: "OPEN" | "CLOSED" | "LIQUIDATED";
  createdAt: string;
  exitPrice: number | null;
  closedAt: string | null;
  pnl: number | null;
}

// BigInt is not JSON-serializable; convert to plain numbers for responses.
export function serializeOrder(
  order: {
    id: string;
    userId: string;
    type: OrderSide;
    asset: string;
    price: bigint;
    quantity: bigint;
    margin: bigint;
    levarage: number;
    status: "OPEN" | "CLOSED" | "LIQUIDATED";
    createdAt: Date;
    exitPrice?: bigint | null;
    closedAt?: Date | null;
  }
): SerializedOrder {
  const entryPrice = fromScaled(order.price);
  const quantity = fromScaled(order.quantity);
  const exitPrice = order.exitPrice != null ? fromScaled(order.exitPrice) : null;
  const pnl =
    order.status === "OPEN" || exitPrice == null
      ? null
      : computePnl(order.type, entryPrice, exitPrice, quantity);
  return {
    id: order.id,
    userId: order.userId,
    type: order.type,
    asset: order.asset,
    price: entryPrice,
    quantity,
    margin: fromScaled(order.margin),
    levarage: order.levarage,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    exitPrice,
    closedAt: order.closedAt ? order.closedAt.toISOString() : null,
    pnl,
  };
}