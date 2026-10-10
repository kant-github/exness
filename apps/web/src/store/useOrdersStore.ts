import { create } from "zustand";
import { Orders } from "../types/prisma-types";

interface OrdersStoreProps {
    orders: Orders[];
    setOrders: (orders: Orders[]) => void;
    addOrder: (order: Orders) => void;
}

export const useOrdersStore = create<OrdersStoreProps>((set) => ({
    orders: [],
    setOrders: (orders: Orders[]) => set({ orders }),
    addOrder: (order: Orders) =>
        set((state) => ({ orders: [order, ...state.orders] })),
}))
