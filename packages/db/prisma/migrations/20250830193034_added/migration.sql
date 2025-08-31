/*
  Warnings:

  - You are about to drop the column `locked` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `levarage` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `margin` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'CLOSED', 'LIQUIDATED');

-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "locked",
DROP COLUMN "qty",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "levarage" INTEGER NOT NULL,
ADD COLUMN     "margin" INTEGER NOT NULL,
ADD COLUMN     "quantity" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- DropTable
DROP TABLE "Trade";
