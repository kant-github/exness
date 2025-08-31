import { useLivePricesStore } from "../store/useLivePricesStore";

export default class TradeSocket {
    private ws: WebSocket | null = null;
    private buffer: Record<string, any> = {};
    private flushInterval: any;

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
                const message = JSON.parse(data);
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
            clearInterval(this.flushInterval);
            setTimeout(() => this.initialize_websocket_connection(), 3000);
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
        clearInterval(this.flushInterval);
        const { setConnectionStatus } = useLivePricesStore.getState();
        setConnectionStatus(false);
    }
}
