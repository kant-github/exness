-- AlterTable
ALTER TABLE "Balance" ALTER COLUMN "total" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "tradable" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "locked" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "closePrice" BIGINT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "pnl" BIGINT;

-- CreateIndex
CREATE INDEX "Orders_userId_status_idx" ON "Orders"("userId", "status");

-- CreateIndex
CREATE INDEX "Orders_asset_status_idx" ON "Orders"("asset", "status");
