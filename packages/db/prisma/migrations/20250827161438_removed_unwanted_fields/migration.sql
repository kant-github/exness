/*
  Warnings:

  - You are about to drop the `trades` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "trades";

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "tradeTime" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("tradeTime","id")
);
