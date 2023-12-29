/*
  Warnings:

  - You are about to drop the column `activityId` on the `EtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subgroupId` on the `EtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `activityId` on the `ExternalEtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `mainCheckRecordId` on the `ExternalEtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subgroupId` on the `ExternalEtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `ExternalEtogetherActivityCheckRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registerId]` on the table `EtogetherActivityCheckRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registerId]` on the table `ExternalEtogetherActivityCheckRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registerId` to the `EtogetherActivityCheckRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registerId` to the `ExternalEtogetherActivityCheckRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" DROP CONSTRAINT "EtogetherActivityCheckRecord_activityId_fkey";

-- DropForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" DROP CONSTRAINT "EtogetherActivityCheckRecord_subgroupId_fkey";

-- DropForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" DROP CONSTRAINT "EtogetherActivityCheckRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" DROP CONSTRAINT "ExternalEtogetherActivityCheckRecord_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" DROP CONSTRAINT "ExternalEtogetherActivityCheckRecord_mainCheckRecordId_fkey";

-- DropForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" DROP CONSTRAINT "ExternalEtogetherActivityCheckRecord_subgroupId_fkey";

-- DropIndex
DROP INDEX "EtogetherActivityCheckRecord_userId_activityId_key";

-- AlterTable
ALTER TABLE "EtogetherActivityCheckRecord" DROP COLUMN "activityId",
DROP COLUMN "subgroupId",
DROP COLUMN "userId",
ADD COLUMN     "registerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ExternalEtogetherActivityCheckRecord" DROP COLUMN "activityId",
DROP COLUMN "mainCheckRecordId",
DROP COLUMN "subgroupId",
DROP COLUMN "username",
ADD COLUMN     "registerId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EtogetherActivityCheckRecord_registerId_key" ON "EtogetherActivityCheckRecord"("registerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalEtogetherActivityCheckRecord_registerId_key" ON "ExternalEtogetherActivityCheckRecord"("registerId");

-- AddForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" ADD CONSTRAINT "EtogetherActivityCheckRecord_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "EtogetherActivityRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" ADD CONSTRAINT "ExternalEtogetherActivityCheckRecord_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "ExternalEtogetherActivityRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
