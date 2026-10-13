-- CreateEnum
CREATE TYPE "CloseReason" AS ENUM ('MANUAL', 'STOP_LOSS', 'TAKE_PROFIT', 'LIQUIDATION');

-- Balances are now stored in integer cents. Widen first so the conversion cannot overflow.
ALTER TABLE "Balance"
    ALTER COLUMN "total" SET DATA TYPE BIGINT,
    ALTER COLUMN "tradable" SET DATA TYPE BIGINT,
    ALTER COLUMN "locked" SET DATA TYPE BIGINT,
    ALTER COLUMN "total" SET DEFAULT 1000000,
    ALTER COLUMN "tradable" SET DEFAULT 1000000;

UPDATE "Balance" SET "total" = "total" * 100, "tradable" = "tradable" * 100, "locked" = "locked" * 100;

-- AlterTable
ALTER TABLE "Orders"
    DROP COLUMN "decimals",
    ADD COLUMN "stopLoss" BIGINT,
    ADD COLUMN "takeProfit" BIGINT,
    ADD COLUMN "closePrice" BIGINT,
    ADD COLUMN "pnl" BIGINT,
    ADD COLUMN "closeReason" "CloseReason",
    ADD COLUMN "closedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Orders_userId_status_idx" ON "Orders"("userId", "status");

-- CreateIndex
CREATE INDEX "Orders_status_asset_idx" ON "Orders"("status", "asset");
