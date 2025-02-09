-- AlterTable
ALTER TABLE "TianiShopListing" ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TianiShopCart" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TianiShopCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TianiShopCartItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TianiShopCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TianiShopCart_userId_key" ON "TianiShopCart"("userId");

-- CreateIndex
CREATE INDEX "TianiShopCart_userId_idx" ON "TianiShopCart"("userId");

-- CreateIndex
CREATE INDEX "TianiShopCartItem_cartId_idx" ON "TianiShopCartItem"("cartId");

-- CreateIndex
CREATE INDEX "TianiShopCartItem_listingId_idx" ON "TianiShopCartItem"("listingId");

-- AddForeignKey
ALTER TABLE "TianiShopCart" ADD CONSTRAINT "TianiShopCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopCartItem" ADD CONSTRAINT "TianiShopCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "TianiShopCart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopCartItem" ADD CONSTRAINT "TianiShopCartItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "TianiShopListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
