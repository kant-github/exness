'use client'

import TradeSocket from "../../src/socket/TradeSocket"

export default function Page() {
    new TradeSocket();
    return (
        <div>
            Trade
        </div>
    )
}