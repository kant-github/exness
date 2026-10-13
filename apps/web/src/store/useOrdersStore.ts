import axios from "axios";
import { create } from "zustand";
import { Orders } from "../types/prisma-types";
import { useUserDataStore } from "./useUserDataStore";

const API_URL = 'http://localhost:4000/api';

interface OrdersStoreProps {
    orders: Orders[];
    refresh: (token: string) => Promise<void>;
    closeOrder: (token: string, orderId: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersStoreProps>((set, get) => ({
    orders: [],

    refresh: async (token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [ordersRes, userRes] = await Promise.all([
                axios.get(`${API_URL}/orders`, { headers }),
                axios.get(`${API_URL}/user`, { headers }),
            ]);
            set({ orders: ordersRes.data.orders });
            useUserDataStore.getState().setUserData(userRes.data.user);
        } catch (err) {
            console.error(err);
        }
    },

    closeOrder: async (token: string, orderId: string) => {
        await axios.post(`${API_URL}/trade/close`, { orderId }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        await get().refresh(token);
    },
}));
