-- CreateEnum
CREATE TYPE "YideWorkActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'YIDEWORK_ADMIN';

-- AlterTable
ALTER TABLE "ClassActivity" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "EtogetherActivity" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Example" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VolunteerActivity" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "YideWorkLocation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YideWorkLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YideWorkActivity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationId" INTEGER NOT NULL,
    "status" "YideWorkActivityStatus" NOT NULL DEFAULT 'PUBLISHED',
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organiserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "YideWorkActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YideWorkActivity_title_idx" ON "YideWorkActivity"("title");

-- CreateIndex
CREATE INDEX "YideWorkActivity_organiserId_idx" ON "YideWorkActivity"("organiserId");

-- CreateIndex
CREATE INDEX "YideWorkActivity_startDateTime_idx" ON "YideWorkActivity"("startDateTime");

-- CreateIndex
CREATE INDEX "YideWorkActivity_locationId_idx" ON "YideWorkActivity"("locationId");

-- AddForeignKey
ALTER TABLE "YideWorkActivity" ADD CONSTRAINT "YideWorkActivity_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "YideWorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YideWorkActivity" ADD CONSTRAINT "YideWorkActivity_organiserId_fkey" FOREIGN KEY ("organiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
