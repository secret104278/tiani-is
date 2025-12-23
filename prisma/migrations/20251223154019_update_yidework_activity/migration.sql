/*
  Warnings:

  - You are about to drop the column `presetId` on the `YideWorkActivity` table. All the data in the column will be lost.
  - You are about to drop the `YideWorkPreset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "YideWorkActivity" DROP CONSTRAINT "YideWorkActivity_presetId_fkey";

-- AlterTable
ALTER TABLE "YideWorkActivity" DROP COLUMN "presetId",
ADD COLUMN     "festival" TEXT;

-- DropTable
DROP TABLE "YideWorkPreset";
