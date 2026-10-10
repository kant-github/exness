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
  user?: User;  // optional to avoid circular typing
  type: OrderType;
  asset: string;
  price: number;     // descaled by the server before responding
  quantity: number;  // lots, descaled by the server
  margin: number;
  levarage: number;
  decimals: number;
  status: OrderStatus;
  createdAt: string; // ISO date string when coming from API
}

export type OrderType = "LONG" | "SHORT";
export type OrderStatus = "OPEN" | "CLOSED" | "LIQUIDATED";
