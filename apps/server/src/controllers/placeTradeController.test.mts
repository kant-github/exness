import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// The server is normally bundled with esbuild, which resolves extensionless
// relative imports like "../prices/live_prices". Node's ESM loader does not,
// so retry such imports with a .ts extension.
registerHooks({
    resolve(specifier, context, nextResolve) {
        try {
            return nextResolve(specifier, context);
        } catch (err) {
            if (
                (err as { code?: string })?.code === "ERR_MODULE_NOT_FOUND" &&
                (specifier.startsWith("./") || specifier.startsWith("../")) &&
                !specifier.endsWith(".ts")
            ) {
                return nextResolve(`${specifier}.ts`, context);
            }
            throw err;
        }
    },
});

// The installed @types/node still types the deprecated namedExports /
// defaultExport options, while the runtime wants `exports`.
const moduleExports = (exports: Record<string, unknown>) =>
    ({ exports } as unknown as Parameters<typeof mock.module>[1]);

// The controller only imports the Request/Response types from express, but
// plain (non-`import type`) imports survive Node's type stripping, so stub
// the module out before the controller is loaded.
mock.module("express", moduleExports({ Request: class { }, Response: class { } }));

type CreatedOrder = Record<string, unknown>;

const createdOrders: CreatedOrder[] = [];
const balanceUpdates: Record<string, unknown>[] = [];

const balanceRow = { id: "b1", userId: "u1", total: 10000, tradable: 10000, locked: 0 };

function applyChange(current: number, change: unknown): number {
    if (typeof change === "number") return change;
    if (change && typeof change === "object") {
        const op = change as { increment?: number; decrement?: number };
        if (typeof op.increment === "number") return current + op.increment;
        if (typeof op.decrement === "number") return current - op.decrement;
    }
    return current;
}

const txMock = {
    orders: {
        create: async ({ data }: { data: CreatedOrder }) => {
            createdOrders.push(data);
            return { id: "order-1", createdAt: new Date(0), ...data };
        },
    },
    balance: {
        findUnique: async () => ({ ...balanceRow }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
            balanceUpdates.push(data);
            return {
                ...balanceRow,
                tradable: applyChange(balanceRow.tradable, data.tradable),
                locked: applyChange(balanceRow.locked, data.locked),
            };
        },
    },
};

const prismaMock = {
    ...txMock,
    $transaction: async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
};

mock.module("@repo/db/client", moduleExports({ default: prismaMock }));

const { prices_of_assets } = await import("../prices/live_prices.ts");
// tsc (nodenext) types the controller as a CommonJS module, but at runtime
// Node's module-syntax detection loads it as ESM, where .default is the
// controller function.
const controllerModule = (await import("./placeTradeController.ts")) as unknown as {
    default: (req: unknown, res: unknown) => Promise<unknown>;
};
const placeTradeController = controllerModule.default;

function makeRes() {
    const res = {
        statusCode: 0,
        jsonCalls: [] as unknown[],
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(body: unknown) {
            this.jsonCalls.push(body);
            return this;
        },
    };
    return res;
}

test("placing a trade responds 200 with the created order and locks the margin", async () => {
    createdOrders.length = 0;
    balanceUpdates.length = 0;
    prices_of_assets.set("BTCUSDT", { bid: 99, ask: 100, last: 100, spread: 0 });

    const req = {
        body: { asset: "BTCUSDT", type: "ASK", lots: 2, levarage: 10 },
        user: { id: "u1" },
    };
    const res = makeRes();

    await placeTradeController(req, res);

    // The browser hangs today because no response body is ever sent.
    assert.equal(res.jsonCalls.length, 1, "expected exactly one JSON response to be sent");
    assert.equal(res.statusCode, 200);

    // The order must be persisted: ASK -> LONG, status OPEN.
    assert.equal(createdOrders.length, 1, "expected one order to be created");
    const order = createdOrders[0] as { type: string; status: string; asset: string; levarage: number };
    assert.equal(order.type, "LONG");
    assert.equal(order.status, "OPEN");
    assert.equal(order.asset, "BTCUSDT");
    assert.equal(order.levarage, 10);

    // Margin = price * lots / leverage = 100 * 2 / 10 = 20 USD, moved from
    // tradable to locked.
    assert.equal(balanceUpdates.length, 1, "expected the balance to be updated");
    const update = balanceUpdates[0]!;
    assert.equal(applyChange(balanceRow.tradable, update.tradable), 9980);
    assert.equal(applyChange(balanceRow.locked, update.locked), 20);

    // The response carries the order and the updated balance.
    const body = res.jsonCalls[0] as { order?: { status?: string }; balance?: { tradable?: number } };
    assert.equal(body?.order?.status, "OPEN");
    assert.equal(body?.balance?.tradable, 9980);
});

test("a validation error sends a single error response and stops", async () => {
    createdOrders.length = 0;
    const req = {
        body: { asset: "BTCUSDT", type: "ASK", lots: -1, levarage: 10 },
        user: { id: "u1" },
    };
    const res = makeRes();

    await placeTradeController(req, res);

    assert.equal(res.jsonCalls.length, 1, "expected exactly one error response");
    assert.equal(res.statusCode, 411);
    assert.equal(createdOrders.length, 0, "no order may be created on invalid input");
});
