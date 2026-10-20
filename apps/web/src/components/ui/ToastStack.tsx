'use client';
import { useToastStore } from "../../store/useToastStore";

export default function ToastStack() {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 w-64">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => removeToast(toast.id)}
                    className="bg-neutral-800/95 border border-neutral-600 rounded-md px-3 py-2 text-xs text-neutral-100 shadow-lg cursor-pointer"
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
