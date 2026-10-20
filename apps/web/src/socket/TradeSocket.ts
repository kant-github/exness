import { useLivePricesStore } from "../store/useLivePricesStore";
import { useOrdersStore, type OrderEvent } from "../store/useOrdersStore";
import { useUserSessionStore } from "../store/useUserSessionStore";

type TradeMessage = {
    symbol: string;
    price: string;
    bid_price: string;
    ask_price: string;
};

type SocketMessage = TradeMessage | OrderEvent;

function isOrderEvent(message: SocketMessage): message is OrderEvent {
    return (message as OrderEvent).type === "order_event";
}

export default class TradeSocket {
    private ws: WebSocket | null = null;
    private buffer: Record<string, TradeMessage> = {};
    private flushInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.initialize_websocket_connection();
        this.startFlusher();
    }

    private initialize_websocket_connection() {
        this.ws = new WebSocket("ws://localhost:8080/api/ws");

        this.ws.onopen = () => {
            const { setConnectionStatus } = useLivePricesStore.getState();
            setConnectionStatus(true);
        };

        this.ws.onmessage = ({ data }) => {
            try {
                const parsed = JSON.parse(String(data));
                const message = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;

                if (isOrderEvent(message)) {
                    this.handle_order_event(message);
                    return;
                }

                if (message.symbol && message.price) {
                    // keep only the latest message per symbol
                    this.buffer[message.symbol] = message;
                }
            } catch (err) {
                console.error("Failed to parse message:", err);
            }
        };

        this.ws.onclose = () => {
            const { setConnectionStatus } = useLivePricesStore.getState();
            setConnectionStatus(false);
            if (this.flushInterval) {
                clearInterval(this.flushInterval);
                this.flushInterval = null;
            }
            setTimeout(() => this.initialize_websocket_connection(), 3000);
        };

        this.ws.onerror = () => {
            const { setConnectionStatus } = useLivePricesStore.getState();
            setConnectionStatus(false);
        };
    }

    private handle_order_event(event: OrderEvent) {
        const { session } = useUserSessionStore.getState();
        if (session?.user?.id && event.userId === session.user.id) {
            useOrdersStore.getState().applyOrderEvent(event);
        }
    }

    private startFlusher() {
        this.flushInterval = setInterval(() => {
            const { updatePrice } = useLivePricesStore.getState();
            for (const symbol in this.buffer) {
                const msg = this.buffer[symbol];
                if (!msg) continue;
                updatePrice(
                    msg.symbol,
                    msg.price,
                    msg.bid_price,
                    msg.ask_price
                );
            }
            this.buffer = {};
        }, 2000);
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        const { setConnectionStatus } = useLivePricesStore.getState();
        setConnectionStatus(false);
    }
}
