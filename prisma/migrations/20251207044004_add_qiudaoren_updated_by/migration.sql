-- AlterTable
ALTER TABLE "QiudaorenOnActivity" ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE INDEX "QiudaorenOnActivity_updatedById_idx" ON "QiudaorenOnActivity"("updatedById");

-- AddForeignKey
ALTER TABLE "QiudaorenOnActivity" ADD CONSTRAINT "QiudaorenOnActivity_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
