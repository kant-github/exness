import { Request, Response } from "express";
import { listPositions } from "../trading/positionService";
import { serializeBalance, serializePosition } from "../trading/serialize";

export default async function getPositionsController(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const { open, closed, balance } = await listPositions(userId);
        res.status(200).json({
            balance: balance ? serializeBalance(balance) : null,
            open: open.map(serializePosition),
            closed: closed.map(serializePosition),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
