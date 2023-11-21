/*
  Warnings:

  - You are about to drop the column `checkAt` on the `VolunteerActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `VolunteerActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `VolunteerActivityCheckRecord` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `VolunteerActivityCheckRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,activityId]` on the table `VolunteerActivityCheckRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VolunteerActivityCheckRecord_userId_activityId_type_key";

-- AlterTable
ALTER TABLE "VolunteerActivityCheckRecord" DROP COLUMN "checkAt",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "VolunteerActivityCheckRecordType";

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerActivityCheckRecord_userId_activityId_key" ON "VolunteerActivityCheckRecord"("userId", "activityId");
