interface OrderBigIntFields {
    price: bigint;
    quantity: bigint;
    margin: bigint;
}

// JSON.stringify cannot handle BigInt, so the big integer columns go over the
// wire as strings.
export function serializeOrder<T extends OrderBigIntFields>(order: T) {
    return {
        ...order,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        margin: order.margin.toString()
    };
}
