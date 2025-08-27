import Redis from 'ioredis'
import { WebSocket, WebSocketServer as WSServer } from 'ws'
import dotenv from 'dotenv'
import DatabaseQueue from '../queue/DatabaseQueue';

export interface MessageTypes {
    symbol: string;
    price: string;
    qty: string;
    trade_time: number;
}

dotenv.config();
const REDIS_URL = process.env.REDIS_URL;
const URL = 'wss://stream.binance.com:9443/stream?streams=' +
    [
        'btcusdt@aggTrade',
        'ethusdt@aggTrade',
        'bnbusdt@aggTrade',
        'xrpusdt@aggTrade',
        'adausdt@aggTrade',
    ].join('/');

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
        console.log("initialized");
        this.ws = new WebSocket(URL);
        console.log('new connection made'); ``
        this.ws.onopen = () => {
            console.log("connected to binance")
        }

        this.ws.onmessage = ({ data }) => {
            const parsed_event = JSON.parse(data.toString())
            // console.log("event is : ", parsed_event);
            const event: MessageTypes = {
                symbol: parsed_event.data.s,
                price: parsed_event.data.p,
                qty: parsed_event.data.q,
                trade_time: parsed_event.data.T,
            }
            console.log("event is : ", event);

            this.database_queue.insert_enqueu_trades(event);
            this.publish_event_to_redis(event);
        }
    }

    private get_publisher_key() {
        return "ws:events:trades";
    }

    private async publish_event_to_redis(event: MessageTypes) {
        const key = this.get_publisher_key();
        await this.publisher?.publish(key, JSON.stringify(event));
    }
}