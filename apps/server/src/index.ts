import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import router from './routes';
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
    } catch (err) {
        console.error("Failed to parse message:", message, err);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
