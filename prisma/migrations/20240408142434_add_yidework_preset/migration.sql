-- AlterTable
ALTER TABLE "YideWorkActivity" ADD COLUMN     "presetId" INTEGER;

-- CreateTable
CREATE TABLE "YideWorkPreset" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "YideWorkPreset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "YideWorkActivity" ADD CONSTRAINT "YideWorkActivity_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "YideWorkPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
