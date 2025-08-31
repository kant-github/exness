/*
  Warnings:

  - You are about to alter the column `quantity` on the `Orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - Added the required column `decimals` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "decimals" INTEGER NOT NULL,
ALTER COLUMN "price" SET DATA TYPE BIGINT,
ALTER COLUMN "margin" SET DATA TYPE BIGINT,
ALTER COLUMN "quantity" SET DATA TYPE BIGINT;
