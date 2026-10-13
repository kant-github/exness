import { Request, Response } from "express";
import { listOrders, serializeOrder } from "../trading/orderService";

export default async function getOrdersController(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const orders = await listOrders(String(userId));
        res.status(200).json({ orders: orders.map(serializeOrder) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
