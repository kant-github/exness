import { create } from "zustand";
import { Orders } from "../types/prisma-types";

interface OrdersStoreProps {
    orders: Orders[];
    setOrders: (orders: Orders[]) => void;
    upsertOrder: (order: Orders) => void;
}

export const useOrdersStore = create<OrdersStoreProps>((set) => ({
    orders: [],
    setOrders: (orders) => set({ orders }),
    upsertOrder: (order) =>
        set((state) => {
            const exists = state.orders.some((o) => o.id === order.id);
            return {
                orders: exists
                    ? state.orders.map((o) => (o.id === order.id ? order : o))
                    : [order, ...state.orders],
            };
        }),
}));
