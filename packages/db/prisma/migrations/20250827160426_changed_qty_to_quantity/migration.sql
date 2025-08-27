/*
  Warnings:

  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Trade";

-- CreateTable
CREATE TABLE "trades" (
    "id" SERIAL NOT NULL,
    "trade_time" TIMESTAMPTZ NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);
