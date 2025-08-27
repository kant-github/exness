export default class TradeSocket {
    private ws: WebSocket | null = null;

    constructor() {
        this.initialize_websocket_connection();
    }

    private initialize_websocket_connection() {
        this.ws = new WebSocket("ws://localhost:8080/api/ws");
        this.ws.onmessage = ({ data }) => {
            console.log("received message", data);
        }
    }
}