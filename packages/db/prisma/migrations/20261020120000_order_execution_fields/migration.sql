-- AlterEnum: new order statuses
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING';
ALTER TYPE "OrderStatus" ADD VALUE 'REJECTED';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('MARKET', 'LIMIT', 'STOP');
CREATE TYPE "CloseReason" AS ENUM ('USER', 'STOP_LOSS', 'TAKE_PROFIT', 'LIQUIDATION', 'INSUFFICIENT_FUNDS');

-- AlterTable: new order execution columns
ALTER TABLE "Orders"
  ADD COLUMN "entryType" "EntryType" NOT NULL DEFAULT 'MARKET',
  ADD COLUMN "triggerPrice" DECIMAL(18,8),
  ADD COLUMN "stopLoss" DECIMAL(18,8),
  ADD COLUMN "takeProfit" DECIMAL(18,8),
  ADD COLUMN "closePrice" DECIMAL(18,8),
  ADD COLUMN "closeReason" "CloseReason",
  ADD COLUMN "openedAt" TIMESTAMPTZ(6),
  ADD COLUMN "closedAt" TIMESTAMPTZ(6);

-- AlterTable: numeric money/price columns
ALTER TABLE "Orders" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,8) USING "price"::DECIMAL(18,8);
ALTER TABLE "Orders" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,8) USING "quantity"::DECIMAL(18,8);
ALTER TABLE "Orders" ALTER COLUMN "margin" SET DATA TYPE DECIMAL(18,8) USING "margin"::DECIMAL(18,8);

-- AlterTable: pending orders are now the default state before money is held
ALTER TABLE "Orders" ALTER COLUMN "entryType" SET DEFAULT 'MARKET';
ALTER TABLE "Orders" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "Orders" ALTER COLUMN "margin" SET DEFAULT 0;
ALTER TABLE "Orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Orders_asset_status_idx" ON "Orders"("asset", "status");
CREATE INDEX "Orders_userId_status_idx" ON "Orders"("userId", "status");
