/*
  Warnings:

  - You are about to alter the column `price` on the `TianiShopListing` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `subtotal` on the `TianiShopOrder` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `total` on the `TianiShopOrder` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `subtotal` on the `TianiShopOrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `price` on the `TianiShopOrderItemSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.

*/
-- AlterTable
ALTER TABLE "TianiShopListing" ALTER COLUMN "price" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "TianiShopOrder" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "TianiShopOrderItem" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "TianiShopOrderItemSnapshot" ALTER COLUMN "price" SET DATA TYPE DECIMAL(19,4);
