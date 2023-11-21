/*
  Warnings:

  - Made the column `checkInAt` on table `VolunteerActivityCheckRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "VolunteerActivityCheckRecord" ALTER COLUMN "checkInAt" SET NOT NULL,
ALTER COLUMN "checkInAt" SET DEFAULT CURRENT_TIMESTAMP;
