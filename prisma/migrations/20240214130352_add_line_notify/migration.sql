-- CreateTable
CREATE TABLE "LineNotify" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,

    CONSTRAINT "LineNotify_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineNotify_userId_key" ON "LineNotify"("userId");

-- AddForeignKey
ALTER TABLE "LineNotify" ADD CONSTRAINT "LineNotify_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
