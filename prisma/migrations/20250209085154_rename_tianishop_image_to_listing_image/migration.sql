/*
  Warnings:

  - You are about to drop the `TianiShopImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TianiShopImage" DROP CONSTRAINT "TianiShopImage_listingId_fkey";

-- DropTable
DROP TABLE "TianiShopImage";

-- CreateTable
CREATE TABLE "TianiShopListingImage" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "thumbhash" VARCHAR(40) NOT NULL,
    "order" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TianiShopListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TianiShopListingImage_listingId_idx" ON "TianiShopListingImage"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "TianiShopListingImage_listingId_order_key" ON "TianiShopListingImage"("listingId", "order");

-- AddForeignKey
ALTER TABLE "TianiShopListingImage" ADD CONSTRAINT "TianiShopListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "TianiShopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
