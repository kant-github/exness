import { create } from "zustand";
import axios from "axios";
import { Orders } from "../types/prisma-types";
import { useUserSessionStore } from "./useUserSessionStore";

const BACKEND_URL = "http://localhost:4000/api";

interface OrdersStoreProps {
    openOrders: Orders[];
    closedOrders: Orders[];
    fetchOrders: (status: "OPEN" | "CLOSED") => Promise<void>;
    closeOrder: (orderId: string) => Promise<boolean>;
}

const authConfig = () => ({
    headers: {
        Authorization: `Bearer ${useUserSessionStore.getState().session?.user?.token}`
    }
});

export const useOrdersStore = create<OrdersStoreProps>((set) => ({
    openOrders: [],
    closedOrders: [],

    fetchOrders: async (status) => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}/orders`, {
                params: { status },
                ...authConfig(),
            });
            if (status === "OPEN") {
                set({ openOrders: data.orders });
            } else {
                set({ closedOrders: data.orders });
            }
        } catch (err) {
            console.error(`Error fetching ${status} orders:`, err);
        }
    },

    closeOrder: async (orderId) => {
        try {
            await axios.post(`${BACKEND_URL}/trade/close`, { orderId }, authConfig());
            set((state) => ({
                openOrders: state.openOrders.filter((order) => order.id !== orderId),
            }));
            // Re-fetch both lists so the closed tab and any liquidations show up.
            void useOrdersStore.getState().fetchOrders("OPEN");
            void useOrdersStore.getState().fetchOrders("CLOSED");
            return true;
        } catch (err) {
            console.error("Error closing order:", err);
            return false;
        }
    },
}));