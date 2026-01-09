-- AlterTable
ALTER TABLE "ClassActivity" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT '義德';

-- CreateIndex
CREATE INDEX "ClassActivity_unit_idx" ON "ClassActivity"("unit");
