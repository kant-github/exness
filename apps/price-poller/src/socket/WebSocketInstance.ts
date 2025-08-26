import { WebSocket, WebSocketServer as WSServer } from 'ws'
import { Server } from 'http'
export default class WebSocketInstance {
    private ws: WebSocket

    constructor() {
        this.ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade")
        this.ws.onopen = () => {
            console.log("connected to binance")
        }

        this.ws.onmessage = (event) => {
            const parsed_event = JSON.parse(JSON.stringify(event.data))
            console.log(parsed_event)
        }
    }
}