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
  total: number | string;
  tradable: number | string;
  locked: number | string;
}

export interface Orders {
  id: string;
  type: OrderType;
  asset: string;
  price: number;
  lots: number;
  margin: number;
  levarage: number;
  status: OrderStatus;
  createdAt: string;
  closePrice: number | null;
  pnl: number | null;
  closedAt: string | null;
}

export type OrderStatus = "OPEN" | "CLOSED" | "LIQUIDATED";

export type OrderType = "LONG" | "SHORT";
