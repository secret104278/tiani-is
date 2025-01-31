-- CreateTable
CREATE TABLE "TianiShopListing" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publisherId" TEXT NOT NULL,

    CONSTRAINT "TianiShopListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TianiShopImage" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "thumbhash" VARCHAR(40) NOT NULL,
    "order" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TianiShopImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TianiShopOrder" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TianiShopOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TianiShopOrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "snapshotId" INTEGER NOT NULL,

    CONSTRAINT "TianiShopOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TianiShopOrderItemSnapshot" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "imageKey" TEXT,
    "thumbhash" VARCHAR(40),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TianiShopOrderItemSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TianiShopListing_startTime_idx" ON "TianiShopListing"("startTime");

-- CreateIndex
CREATE INDEX "TianiShopListing_endTime_idx" ON "TianiShopListing"("endTime");

-- CreateIndex
CREATE INDEX "TianiShopListing_publisherId_idx" ON "TianiShopListing"("publisherId");

-- CreateIndex
CREATE INDEX "TianiShopImage_listingId_idx" ON "TianiShopImage"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "TianiShopImage_listingId_order_key" ON "TianiShopImage"("listingId", "order");

-- CreateIndex
CREATE INDEX "TianiShopOrder_userId_idx" ON "TianiShopOrder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TianiShopOrderItem_snapshotId_key" ON "TianiShopOrderItem"("snapshotId");

-- CreateIndex
CREATE INDEX "TianiShopOrderItem_orderId_idx" ON "TianiShopOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "TianiShopOrderItem_listingId_idx" ON "TianiShopOrderItem"("listingId");

-- AddForeignKey
ALTER TABLE "TianiShopListing" ADD CONSTRAINT "TianiShopListing_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopImage" ADD CONSTRAINT "TianiShopImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "TianiShopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopOrder" ADD CONSTRAINT "TianiShopOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopOrderItem" ADD CONSTRAINT "TianiShopOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TianiShopOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopOrderItem" ADD CONSTRAINT "TianiShopOrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "TianiShopListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TianiShopOrderItem" ADD CONSTRAINT "TianiShopOrderItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TianiShopOrderItemSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
