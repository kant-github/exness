/*
  Warnings:

  - The primary key for the `Trade` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_pkey",
ADD CONSTRAINT "Trade_pkey" PRIMARY KEY ("id", "trade_time");
