import { useLivePricesStore } from "../store/useLivePricesStore";

type TradeMessage = {
    symbol: string;
    price: string;
    bid_price: string;
    ask_price: string;
};

export default class TradeSocket {
    private ws: WebSocket | null = null;
    private buffer: Record<string, TradeMessage> = {};
    private flushInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private isDisconnected = false;

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
                console.log("---------Received message: ", message);
                if (message.symbol && message.price) {
                    console.log("i am receiving message : ", message);
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
            if (!this.isDisconnected) {
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnectTimeout = null;
                    this.initialize_websocket_connection();
                    this.startFlusher();
                }, 3000);
            }
        };

        this.ws.onerror = () => {
            const { setConnectionStatus } = useLivePricesStore.getState();
            setConnectionStatus(false);
        };
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
        this.isDisconnected = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
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
