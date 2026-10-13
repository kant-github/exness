interface PriceData {
    bid: string | number;
    ask: string | number;
    last: string | number;
    spread: number;
    updatedAt: number;
}

export const prices_of_assets: Map<string, PriceData> = new Map();

export const MAX_PRICE_AGE_MS = 15_000;
