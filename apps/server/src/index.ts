import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import router from './routes';
import { prices_of_assets } from './prices/live_prices';
import { getEngine } from './orders/engineSingleton';

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
            bid: parsed_event.bid_price,
            ask: parsed_event.ask_price,
            last: parsed_event.price,
            spread: parsed_event.spread_percentage
        });

        // evaluate pending entries, stop losses, take profits and
        // liquidations on every tick, even with no browser connected
        const bid = parseFloat(String(parsed_event.bid_price));
        const ask = parseFloat(String(parsed_event.ask_price));
        if (Number.isFinite(bid) && Number.isFinite(ask)) {
            getEngine().processTick(parsed_event.symbol, bid, ask);
        }
    } catch (err) {
        console.error("Failed to parse message:", message, err);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
