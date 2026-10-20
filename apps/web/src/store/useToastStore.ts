import { create } from "zustand";

export interface Toast {
    id: number;
    message: string;
}

interface ToastStoreProps {
    toasts: Toast[];
    pushToast: (message: string) => void;
    removeToast: (id: number) => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastStoreProps>((set, get) => ({
    toasts: [],

    pushToast: (message: string) => {
        const id = nextToastId++;
        set((state) => ({ toasts: [...state.toasts, { id, message }] }));
        setTimeout(() => get().removeToast(id), 6000);
    },

    removeToast: (id: number) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
}));
