-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "baoShiPhone" TEXT,
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "yinShiPhone" TEXT;

-- CreateTable
CREATE TABLE "QiudaorenOnActivity" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,

    CONSTRAINT "QiudaorenOnActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QiudaorenOnActivity_userId_idx" ON "QiudaorenOnActivity"("userId");

-- CreateIndex
CREATE INDEX "QiudaorenOnActivity_activityId_idx" ON "QiudaorenOnActivity"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "QiudaorenOnActivity_userId_activityId_key" ON "QiudaorenOnActivity"("userId", "activityId");

-- AddForeignKey
ALTER TABLE "QiudaorenOnActivity" ADD CONSTRAINT "QiudaorenOnActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QiudaorenOnActivity" ADD CONSTRAINT "QiudaorenOnActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "YideWorkActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
