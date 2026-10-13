import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import router from './routes';
import { prices_of_assets } from './prices/live_prices';
import { liquidateLosingPositions, loadOpenPositions } from './trading/openPositions';

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
        const quote = {
            bid: parseFloat(parsed_event.bid_price),
            ask: parseFloat(parsed_event.ask_price),
            last: parseFloat(parsed_event.price),
            spread: parsed_event.spread_percentage
        };
        prices_of_assets.set(parsed_event.symbol, quote);
        liquidateLosingPositions(parsed_event.symbol, quote);
    } catch (err) {
        console.error("Failed to parse message:", message, err);
    }
})

loadOpenPositions().catch((err) => console.error("Failed to load open positions", err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
