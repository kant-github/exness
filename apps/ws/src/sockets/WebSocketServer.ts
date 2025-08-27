import Redis from "ioredis";
import { WebSocket, WebSocketServer as WSServer } from "ws"
import { v4 as uuid } from 'uuid';

import dotenv from 'dotenv'
dotenv.config();
const REDIS_URL = process.env.REDIS_URL;

interface CustomWebSocket extends WebSocket {
    id: string
}

export default class WebSocketServer {
    private wss: WSServer | null = null;
    private subscriber: Redis | null = null;
    private sockets: Map<string, CustomWebSocket> = new Map();

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
            console.log("message came")
            try {
                const parsed_event = JSON.parse(message);
                this.sockets.forEach((socket) => {
                    if (socket.readyState === WebSocket.OPEN) {
                        console.log("sending to socket");
                        socket.send(JSON.stringify(parsed_event));
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