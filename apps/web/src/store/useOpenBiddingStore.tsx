import { create } from 'zustand'

export enum TradeType {
    BID = 'BID',
    ASK = 'ASK'
}

interface OpenBiddingStore {
    tradeType: TradeType | null;
    setTradeType: (type: TradeType | null) => void;
}

export const useOpenBiddingStore = create<OpenBiddingStore>((set) => ({
    tradeType: null,
    setTradeType: (type: TradeType | null) => set({ tradeType: type }),
}))