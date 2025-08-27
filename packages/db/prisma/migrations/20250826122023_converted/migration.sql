/*
  Warnings:

  - Changed the type of `price` on the `Trade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `qty` on the `Trade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "price",
ADD COLUMN     "price" DECIMAL(18,8) NOT NULL,
DROP COLUMN "qty",
ADD COLUMN     "qty" DECIMAL(18,8) NOT NULL;
