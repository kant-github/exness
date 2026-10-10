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
  price: string;     // BigInt → string in JSON, scaled by 10^decimals
  quantity: string;  // BigInt → string in JSON, scaled by 10^decimals
  margin: string;    // BigInt → string in JSON, scaled by 10^decimals
  levarage: number;
  decimals: number;
  status: OrderStatus;
  createdAt: string; // ISO date string when coming from API
}

export type OrderType = "LONG" | "SHORT";
export type OrderStatus = "OPEN" | "CLOSED" | "LIQUIDATED";
