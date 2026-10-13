import prisma from "@repo/db/client";
import { PositionLike, parseScaled, triggerReason } from "./math";
import { PositionRecord, TradeError, closePosition } from "./positionService";

type Tracked = PositionLike & { id: string };

// Open positions per asset. This is only a cache of the database so a tick does not need a query;
// it is rebuilt from the database on start-up and topped up periodically.
const tracked = new Map<string, Map<string, Tracked>>();
const closing = new Set<string>();

export function trackPosition(position: PositionRecord) {
    let forAsset = tracked.get(position.asset);
    if (!forAsset) {
        forAsset = new Map();
        tracked.set(position.asset, forAsset);
    }
    forAsset.set(position.id, position);
}

export function untrackPosition(position: { id: string; asset: string }) {
    tracked.get(position.asset)?.delete(position.id);
}

export function clearTrackedPositions() {
    tracked.clear();
    closing.clear();
}

export async function loadOpenPositions() {
    const open = (await prisma.orders.findMany({ where: { status: "OPEN" } })) as unknown as PositionRecord[];
    open.forEach(trackPosition);
    return open.length;
}

export async function onPriceTick(asset: string, bidPrice: unknown, askPrice: unknown) {
    const forAsset = tracked.get(asset);
    if (!forAsset || forAsset.size === 0) return;
    const bid = parseScaled(bidPrice);
    const ask = parseScaled(askPrice);
    if (bid === null || ask === null) return;

    const work: Promise<void>[] = [];
    for (const position of forAsset.values()) {
        const reason = triggerReason(position, bid, ask);
        if (!reason || closing.has(position.id)) continue;

        closing.add(position.id);
        work.push(
            closePosition({ id: position.id, bid, ask, reason })
                .then(() => untrackPosition({ id: position.id, asset }))
                .catch((err) => {
                    if (err instanceof TradeError && err.status === 404) {
                        untrackPosition({ id: position.id, asset });
                        return;
                    }
                    // Keep it tracked: the next tick retries.
                    console.error(`Failed to close position ${position.id}:`, err);
                })
                .finally(() => closing.delete(position.id)),
        );
    }
    await Promise.all(work);
}

export function startEngine(resyncMs = 30_000) {
    const sync = () => loadOpenPositions().catch((err) => console.error("Failed to load open positions:", err));
    void sync().then((count) => console.log(`Trading engine tracking ${count ?? 0} open positions`));
    return setInterval(() => void sync(), resyncMs);
}
