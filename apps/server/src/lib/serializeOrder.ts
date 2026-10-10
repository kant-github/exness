// Orders store price/quantity as BigInt scaled by `decimals`, and res.json()
// cannot serialize BigInt — convert to plain numbers before responding.
export const PRICE_DECIMALS = 8;

interface OrderRecord {
    price: bigint;
    quantity: bigint;
    margin: bigint;
    decimals: number;
}

export function serializeOrder<T extends OrderRecord>(order: T) {
    return {
        ...order,
        price: Number(order.price) / 10 ** order.decimals,
        quantity: Number(order.quantity) / 10 ** order.decimals,
        margin: Number(order.margin),
    };
}
