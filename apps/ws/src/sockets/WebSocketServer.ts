import Redis from "ioredis";
import { WebSocket, WebSocketServer as WSServer } from "ws"
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv'

interface TradeEvent {
    symbol: string;
    price: string;
    qty: string;
    trade_time: number;
    event_time: number;
    trade_id: number;
    buyer_order_id?: number;
    seller_order_id: number;
    is_buyer_maker: boolean;
    first_trade_id: number;
    last_trade_id: number;
    bid_price: string;
    ask_price: string;
    spread_percentage: number;
}

dotenv.config();
const REDIS_URL = process.env.REDIS_URL;

interface CustomWebSocket extends WebSocket {
    id: string
}

export default class WebSocketServer {
    private wss: WSServer | null = null;
    private subscriber: Redis | null = null;
    private sockets: Map<string, CustomWebSocket> = new Map();
    private spread_percentage: number = 5;

    constructor() {
        this.wss = new WSServer({ port: 8080 });
        this.subscriber = new Redis(REDIS_URL!);

        const key = this.get_publisher_key();
        this.subscriber.subscribe(key);
        this.read_subscriber_message();
        this.intitialize_wss_connection();
    }

    private intitialize_wss_connection() {
        this.wss?.on('connection', (ws: CustomWebSocket) => {
            ws.id = uuid();
            this.sockets.set(ws.id, ws)

            ws.on('close', () => {
                this.sockets.delete(ws.id)
            })
        })
    }

    private read_subscriber_message() {
        this.subscriber?.on('message', (_, message) => {
            try {
                const parsed_event: TradeEvent = JSON.parse(message);
                console.log('parsed event is : ', parsed_event);
                this.sockets.forEach((socket) => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify(message));
                    }
                })
            } catch (err) {
                console.error("Failed to parse message:", message, err);
            }
        });
    }


    private get_publisher_key() {
        return "ws:events:trades"
    }
}