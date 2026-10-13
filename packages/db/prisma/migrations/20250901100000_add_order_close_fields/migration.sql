-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "closePrice" BIGINT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "pnl" INTEGER;
