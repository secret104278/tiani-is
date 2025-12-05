/*
  Warnings:

  - Added the required column `createdById` to the `QiudaorenOnActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QiudaorenOnActivity" ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "QiudaorenOnActivity_createdById_idx" ON "QiudaorenOnActivity"("createdById");

-- AddForeignKey
ALTER TABLE "QiudaorenOnActivity" ADD CONSTRAINT "QiudaorenOnActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
