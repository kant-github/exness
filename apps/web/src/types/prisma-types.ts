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
  // integer cents
  total: number;
  tradable: number;
  locked: number;
}

export type PositionStatus = "OPEN" | "CLOSED" | "LIQUIDATED";
export type CloseReason = "MANUAL" | "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION";

// Prices and lots are decimal strings; margin and pnl are integer cents.
export interface Orders {
  id: string;
  asset: string;
  type: OrderType;
  status: PositionStatus;
  price: string;
  lots: string;
  margin: number;
  levarage: number;
  stopLoss: string | null;
  takeProfit: string | null;
  closePrice: string | null;
  pnl: number | null;
  closeReason: CloseReason | null;
  createdAt: string;
  closedAt: string | null;
}

export type OrderType = "LONG" | "SHORT";
