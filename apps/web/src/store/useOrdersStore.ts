import { create } from "zustand";
import axios from "axios";
import type { Orders, Balance } from "../types/prisma-types";
import { useToastStore } from "./useToastStore";
import { useUserDataStore } from "./useUserDataStore";

const BACKEND_URL = "http://localhost:4000";

export interface OrderEvent {
    type: "order_event";
    userId: string;
    event: "ORDER_OPENED" | "ORDER_CLOSED" | "ORDER_REJECTED";
    message: string;
    order: Orders;
    balance: { total: number; tradable: number; locked: number } | null;
}

interface OrdersStoreProps {
    orders: Orders[];
    fetchOrders: (token: string) => Promise<void>;
    applyOrderEvent: (event: OrderEvent) => void;
}

export const useOrdersStore = create<OrdersStoreProps>((set) => ({
    orders: [],

    fetchOrders: async (token: string) => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}/api/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ orders: data.orders ?? [] });
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    },

    applyOrderEvent: (event: OrderEvent) => {
        set((state) => {
            const existing = state.orders.findIndex((o) => o.id === event.order.id);
            const orders = [...state.orders];
            if (existing >= 0) {
                orders[existing] = event.order;
            } else {
                orders.unshift(event.order);
            }
            return { orders };
        });

        if (event.balance) {
            const { userData, setUserData } = useUserDataStore.getState();
            if (userData) {
                setUserData({
                    ...userData,
                    Balance: {
                        ...(userData.Balance ?? {
                            id: "",
                            userId: event.userId,
                        }),
                        total: event.balance.total,
                        tradable: event.balance.tradable,
                        locked: event.balance.locked,
                    } as Balance,
                });
            }
        }

        useToastStore.getState().pushToast(event.message);
    },
}));
