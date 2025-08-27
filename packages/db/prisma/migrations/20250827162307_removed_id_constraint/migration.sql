/*
  Warnings:

  - The primary key for the `Trade` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tradeTime` on the `Trade` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,8)`.
  - You are about to alter the column `volume` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,8)`.
  - You are about to alter the column `quantity` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,8)`.
  - Added the required column `trade_time` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_pkey",
DROP COLUMN "tradeTime",
ADD COLUMN     "trade_time" TIMESTAMPTZ(6) NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "volume" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,8),
ADD CONSTRAINT "Trade_pkey" PRIMARY KEY ("id", "trade_time");
