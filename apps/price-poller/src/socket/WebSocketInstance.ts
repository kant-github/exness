import Redis from 'ioredis'
import { WebSocket, WebSocketServer as WSServer } from 'ws'
import dotenv from 'dotenv'
import DatabaseQueue from '../queue/DatabaseQueue';


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
}

interface EnhancedTradeEvent extends TradeEvent {
    bid_price: string;
    ask_price: string;
    spread_percentage: number;
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
    private spread_percentage: number = 1;

    constructor() {
        this.initialize_binance_connection()
        this.publisher = new Redis(REDIS_URL!);
        this.database_queue = new DatabaseQueue();
    }

    private initialize_binance_connection() {
        console.log("initialized");
        this.ws = new WebSocket(URL);
        console.log('new connection made');

        this.ws.onopen = () => {
            console.log("connected to binance")
        }

        this.ws.onmessage = ({ data }) => {
            const parsed_event = JSON.parse(data.toString())

            const event: TradeEvent = {
                symbol: parsed_event.data.s,
                price: parsed_event.data.p,
                qty: parsed_event.data.q,
                trade_time: parsed_event.data.T,
                event_time: parsed_event.data.E,
                trade_id: parsed_event.data.a,
                buyer_order_id: parsed_event.data.b,
                seller_order_id: parsed_event.data.a,
                is_buyer_maker: parsed_event.data.m,
                first_trade_id: parsed_event.data.f,
                last_trade_id: parsed_event.data.l
            }

            console.log("event is : ", event);
            this.database_queue.insert_enqueu_trades(event);
            this.publish_event_to_redis(event);
        }
    }

    private get_publisher_key() {
        return "ws:events:trades";
    }

    private async publish_event_to_redis(event: TradeEvent) {
        const key = this.get_publisher_key();
        const spreaded_data = this.calculate_spread(event.price);

        const enhanced_event: EnhancedTradeEvent = {
            ...event,
            bid_price: spreaded_data.bid,
            ask_price: spreaded_data.ask,
            spread_percentage: this.spread_percentage
        }
        await this.publisher?.publish(key, JSON.stringify(enhanced_event));
    }

    private calculate_spread(price: string): { bid: string, ask: string } {
        const numeric_price = parseFloat(price);
        const spread_multiplier = this.spread_percentage / 100;

        const bidPrice = numeric_price * (1 - spread_multiplier);
        const askPrice = numeric_price * (1 + spread_multiplier);
        const decimalPlaces = (price.split('.')[1] || '').length;

        return {
            bid: bidPrice.toFixed(decimalPlaces),
            ask: askPrice.toFixed(decimalPlaces)
        };
    }
}