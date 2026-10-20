// frontend/types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  Balance?: Balance | null;
  Orders: Orders[];
}

export interface Trade {
  id: number;
  tradeTime: string; // ISO date string when coming from API
  symbol: string;
  price: string;     // keep as string if you’re fetching from API (Decimal)
  quantity: string;  // same reason
}

export interface Balance {
  id: string;
  userId: string;
  user?: User;   // optional to avoid circular requirement in frontend
  total: number;
  tradable: number;
  locked: number;
}

export interface Orders {
  id: string;
  userId: string;
  type: OrderType;
  asset: string;
  entryType: EntryType;
  triggerPrice: number | null;
  price: number;
  quantity: number;
  margin: number;
  levarage: number;
  decimals: number;
  status: OrderStatus;
  stopLoss: number | null;
  takeProfit: number | null;
  closePrice: number | null;
  closeReason: CloseReason | null;
  createdAt: string;
  openedAt: string | null;
  closedAt: string | null;
}

export type OrderType = "LONG" | "SHORT";
export type EntryType = "MARKET" | "LIMIT" | "STOP";
export type OrderStatus = "PENDING" | "OPEN" | "CLOSED" | "REJECTED" | "CANCELLED";
export type CloseReason = "USER" | "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION" | "INSUFFICIENT_FUNDS";

export const CLOSE_REASON_LABELS: Record<string, string> = {
  USER: "You closed it",
  STOP_LOSS: "Stop loss",
  TAKE_PROFIT: "Take profit",
  LIQUIDATION: "Out of margin (liquidated)",
  INSUFFICIENT_FUNDS: "Never opened — not enough free money",
};
