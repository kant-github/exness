import { create } from "zustand";

export enum TradingSymbol {
    BTCUSDT = 'BTCUSDT',
    ETHUSDT = 'ETHUSDT',
    BNBUSDT = 'BNBUSDT',
    XRPUSDT = 'XRPUSDT',
    ADAUSDT = 'ADAUSDT'
}

export enum PriceChangeDirection {
    UP = 'UP',
    DOWN = 'DOWN',
    NEUTRAL = 'NEUTRAL'
}

export interface LivePriceData {
    symbol: TradingSymbol;
    price: string;
    change24h: string;
    changePercent24h: string;
    direction: PriceChangeDirection;
    lastUpdate: number;
    volume?: string;
    tradeTime?: number;
    eventTime?: number;
    tradeId?: number;
    isBuyerMaker?: boolean;
    bidPrice: string;
    askPrice: string;
}

interface LivePricesStoreProps {
    prices: Record<string, LivePriceData>;
    isConnected: boolean;
    selectedSymbol: TradingSymbol;

    updatePrice: (symbol: string, price: string, bidPrice: string, askPrice: string, changePercent?: string) => void;
    setSelectedSymbol: (symbol: TradingSymbol) => void;
    setConnectionStatus: (connected: boolean) => void;
}

const createDefaultPrice = (symbol: TradingSymbol): LivePriceData => ({
    symbol,
    price: '0.00',
    change24h: '0.00',
    changePercent24h: '0.00',
    direction: PriceChangeDirection.NEUTRAL,
    lastUpdate: Date.now(),
    bidPrice: '0.00',
    askPrice: '0.00',
});

export const useLivePricesStore = create<LivePricesStoreProps>((set, get) => ({
    prices: {
        [TradingSymbol.BTCUSDT]: createDefaultPrice(TradingSymbol.BTCUSDT),
        [TradingSymbol.ETHUSDT]: createDefaultPrice(TradingSymbol.ETHUSDT),
        [TradingSymbol.BNBUSDT]: createDefaultPrice(TradingSymbol.BNBUSDT),
        [TradingSymbol.XRPUSDT]: createDefaultPrice(TradingSymbol.XRPUSDT),
        [TradingSymbol.ADAUSDT]: createDefaultPrice(TradingSymbol.ADAUSDT),
    },
    isConnected: false,
    selectedSymbol: TradingSymbol.BTCUSDT,

    updatePrice: (symbol: string, price: string, bidPrice: string, askPrice: string, changePercent: string = '0.00') => {
        const { prices } = get();
        const currentPrice = parseFloat(prices[symbol]?.price || '0');
        const newPrice = parseFloat(price);

        let direction = prices[symbol]?.direction || PriceChangeDirection.NEUTRAL;

        if (newPrice > currentPrice) {
            direction = PriceChangeDirection.UP;
        } else if (newPrice < currentPrice) {
            direction = PriceChangeDirection.DOWN;
        }

        set(state => {
            const prev = state.prices[symbol] || createDefaultPrice(symbol as TradingSymbol);

            return {
                prices: {
                    ...state.prices,
                    [symbol]: {
                        ...prev,
                        price,
                        changePercent24h: changePercent,
                        direction,
                        lastUpdate: Date.now(),
                        bidPrice,
                        askPrice,
                    },
                },
            };
        });
    },

    setSelectedSymbol: (symbol: TradingSymbol) => {
        set({ selectedSymbol: symbol });
    },

    setConnectionStatus: (connected: boolean) => {
        set({ isConnected: connected });
    }
}));
