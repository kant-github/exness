const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const SIGNIN_URL = BACKEND_URL + '/api/auth/signin'; 

const API_URL = (BACKEND_URL ?? 'http://localhost:4000') + '/api';

export const TRADE_URL = API_URL + '/trade';
export const POSITIONS_URL = API_URL + '/positions';
export const closeTradeUrl = (id: string) => `${TRADE_URL}/${id}/close`;
