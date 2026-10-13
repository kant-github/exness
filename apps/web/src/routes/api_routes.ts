const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export const SIGNIN_URL = BACKEND_URL + '/api/auth/signin';
export const TRADE_URL = BACKEND_URL + '/api/trade';
export const ORDERS_URL = BACKEND_URL + '/api/orders';
export const closeOrderUrl = (id: string) => `${BACKEND_URL}/api/orders/${id}/close`;
