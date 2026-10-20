import Redis from "ioredis";
import { OrderEngine } from "./orderEngine";

let engine: OrderEngine | null = null;

export function getEngine(): OrderEngine {
    if (!engine) {
        const publisher = new Redis(process.env.REDIS_URL!);
        engine = new OrderEngine(publisher);
    }
    return engine;
}
