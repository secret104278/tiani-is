-- CreateEnum
CREATE TYPE "TianiShopOrderStatus" AS ENUM ('PENDING', 'CANCELLED');

-- AlterTable
ALTER TABLE "TianiShopOrder" ADD COLUMN     "status" "TianiShopOrderStatus" NOT NULL DEFAULT 'PENDING';
