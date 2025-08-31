import TradeSocket from "../socket/TradeSocket";

let socket: TradeSocket | null = null;

export function getSocket() {
    if (!socket) {
        socket = new TradeSocket();
    }
    return socket;
}

export function destroySocket() {
    socket = null;
}