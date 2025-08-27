/*
  Warnings:

  - You are about to drop the column `volume` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `symbol` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "volume",
ADD COLUMN     "symbol" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Trade_symbol_trade_time_idx" ON "Trade"("symbol", "trade_time");
