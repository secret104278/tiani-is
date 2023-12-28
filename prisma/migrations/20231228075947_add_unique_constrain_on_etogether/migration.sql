/*
  Warnings:

  - A unique constraint covering the columns `[userId,activityId]` on the table `EtogetherActivityCheckRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,activityId]` on the table `EtogetherActivityRegister` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EtogetherActivityCheckRecord" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "EtogetherActivityCheckRecord_userId_activityId_key" ON "EtogetherActivityCheckRecord"("userId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "EtogetherActivityRegister_userId_activityId_key" ON "EtogetherActivityRegister"("userId", "activityId");
