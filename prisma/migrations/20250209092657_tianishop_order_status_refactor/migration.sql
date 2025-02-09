/*
  Warnings:

  - You are about to drop the column `status` on the `TianiShopOrder` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TianiShopOrderItemStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "TianiShopOrder" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "TianiShopOrderItem" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "status" "TianiShopOrderItemStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "TianiShopOrderStatus";
