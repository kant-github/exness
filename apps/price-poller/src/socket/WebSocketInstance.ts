import Redis from 'ioredis'
import { WebSocket, WebSocketServer as WSServer } from 'ws'
import dotenv from 'dotenv'
import DatabaseQueue from '../queue/DatabaseQueue';

dotenv.config();
const REDIS_URL = process.env.REDIS_URL;

export default class WebSocketInstance {
    private ws: WebSocket | null = null;
    private publisher: Redis | null = null;
    private database_queue: DatabaseQueue;
    constructor() {
        this.initialize_binance_connection()
        this.publisher = new Redis(REDIS_URL!);
        this.database_queue = new DatabaseQueue();
    }

    private initialize_binance_connection() {
        this.ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade")
        this.ws.onopen = () => {
            console.log("connected to binance")
        }

        this.ws.onmessage = ({data}) => {
            const parsed_event = JSON.parse(data.toString())
            this.database_queue.insert_enqueu_trades({
                symbol: parsed_event.s,
                price: parsed_event.p,
                qty: parsed_event.q,
                trade_time: parsed_event.T,
            })
        }
    }

    private get_publisher_key() {
        return 'key'
    }
}