import { create } from "zustand";
import axios from "axios";
import { Balance, Orders } from "../types/prisma-types";
import { POSITIONS_URL, TRADE_URL, closeTradeUrl } from "../routes/api_routes";
import { useUserDataStore } from "./useUserDataStore";

interface PlaceOrderInput {
    asset: string;
    type: string | null;
    lots: number;
    levarage: number;
    stopLoss?: number;
    takeProfit?: number;
}

interface PositionsStoreProps {
    open: Orders[];
    closed: Orders[];
    refresh: (token: string) => Promise<void>;
    placeOrder: (token: string, input: PlaceOrderInput) => Promise<void>;
    closePosition: (token: string, id: string) => Promise<void>;
}

// Bumped by every action so a slow poll never overwrites a fresher result.
let version = 0;

function errorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.message ?? "Could not reach the server";
    }
    return "Something went wrong";
}

function applyBalance(balance: Balance | null | undefined) {
    if (balance) useUserDataStore.getState().setUserData({ Balance: balance });
}

export const usePositionsStore = create<PositionsStoreProps>((set) => ({
    open: [],
    closed: [],

    refresh: async (token) => {
        const startedAt = version;
        try {
            const { data } = await axios.get(POSITIONS_URL, { headers: { Authorization: `Bearer ${token}` } });
            if (startedAt !== version) return;
            set({ open: data.open, closed: data.closed });
            applyBalance(data.balance);
        } catch (err) {
            console.error("Failed to load positions:", err);
        }
    },

    placeOrder: async (token, input) => {
        try {
            const { data } = await axios.post(TRADE_URL, input, { headers: { Authorization: `Bearer ${token}` } });
            version++;
            set((state) => ({ open: [data.position, ...state.open] }));
            applyBalance(data.balance);
        } catch (err) {
            throw new Error(errorMessage(err));
        }
    },

    closePosition: async (token, id) => {
        try {
            const { data } = await axios.post(closeTradeUrl(id), {}, { headers: { Authorization: `Bearer ${token}` } });
            version++;
            set((state) => ({
                open: state.open.filter((p) => p.id !== id),
                closed: [data.position, ...state.closed.filter((p) => p.id !== id)],
            }));
            applyBalance(data.balance);
        } catch (err) {
            throw new Error(errorMessage(err));
        }
    },
}));
