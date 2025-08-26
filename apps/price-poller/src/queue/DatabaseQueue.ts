import Bull from "bull";
import dotenv from 'dotenv'
import prisma from '@repo/db/client'

dotenv.config();
const REDIS_URL = process.env.REDIS_URL;
export default class DatabaseQueue {
    private trade_queue: Bull.Queue;
    private batch: any[] = [];
    private batch_size: number = 100;

    constructor() {
        this.trade_queue = new Bull('database-operations', {
            redis: REDIS_URL
        })
        this.init_processors();
    }

    private init_processors() {
        this.trade_queue.process(100, async (jobs) => {
            this.batch.push(jobs.data);
            if (this.batch.length === this.batch_size) {

                this.process_batch();
            }
        })
    }

    private async process_batch() {
        console.log("processing batch ------------------------------ >");
        await prisma.trade.createMany({
            data: this.batch.map((trade) => {
                return {
                    symbol: trade.symbol,
                    price: trade.price,
                    qty: trade.qty,
                    trade_time: new Date(trade.trade_time)
                }
            })
        })
        this.batch = [];
    }

    public async insert_enqueu_trades(trade: {
        symbol: string;
        price: string;
        qty: string;
        trade_time: number;
    }) {
        await this.trade_queue.add(trade, { removeOnComplete: true });
    }
}