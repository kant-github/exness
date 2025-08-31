interface PriceData {
    bid: number;
    ask: number;
    last: number;
    spread: number;
}

export const prices_of_assets: Map<string, PriceData> = new Map();

