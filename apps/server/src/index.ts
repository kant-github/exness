import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import router from './routes';
import { prices_of_assets } from './prices/live_prices';
import { liquidateLosingOrders } from './trading/liquidation';

dotenv.config();

const PORT = process.env.PORT;
const REDIS_URL = process.env.REDIS_URL;
const app = express();

app.use(express.json());
app.use(cors({
    origin: '*',
}));
app.use('/api', router);

const susbcriber = new Redis(REDIS_URL!)
susbcriber.subscribe('ws:events:trades');
susbcriber.on('message', (channel, message) => {
    try {
        const parsed_event = JSON.parse(message);
        prices_of_assets.set(parsed_event.symbol, {
            bid: Number(parsed_event.bid_price),
            ask: Number(parsed_event.ask_price),
            last: Number(parsed_event.price),
            spread: Number(parsed_event.spread_percentage)
        });
        void liquidateLosingOrders(parsed_event.symbol);
    } catch (err) {
        console.error("Failed to parse message:", message, err);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
