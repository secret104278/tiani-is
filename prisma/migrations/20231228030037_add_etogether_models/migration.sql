-- CreateEnum
CREATE TYPE "EtogetherActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ETOGETHER_ADMIN';

-- CreateTable
CREATE TABLE "EtogetherActivitySubgroup" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "etogetherActivityId" INTEGER NOT NULL,

    CONSTRAINT "EtogetherActivitySubgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtogetherActivity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "status" "EtogetherActivityStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organiserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EtogetherActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtogetherActivityRegister" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "subgroupId" INTEGER NOT NULL,

    CONSTRAINT "EtogetherActivityRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalEtogetherActivityRegister" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "mainRegisterId" INTEGER NOT NULL,
    "subgroupId" INTEGER NOT NULL,

    CONSTRAINT "ExternalEtogetherActivityRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtogetherActivityCheckRecord" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "subgroupId" INTEGER NOT NULL,

    CONSTRAINT "EtogetherActivityCheckRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalEtogetherActivityCheckRecord" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "mainCheckRecordId" INTEGER NOT NULL,
    "subgroupId" INTEGER NOT NULL,

    CONSTRAINT "ExternalEtogetherActivityCheckRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EtogetherActivity_title_idx" ON "EtogetherActivity"("title");

-- CreateIndex
CREATE INDEX "EtogetherActivity_organiserId_idx" ON "EtogetherActivity"("organiserId");

-- CreateIndex
CREATE INDEX "EtogetherActivity_startDateTime_idx" ON "EtogetherActivity"("startDateTime");

-- AddForeignKey
ALTER TABLE "EtogetherActivitySubgroup" ADD CONSTRAINT "EtogetherActivitySubgroup_etogetherActivityId_fkey" FOREIGN KEY ("etogetherActivityId") REFERENCES "EtogetherActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivity" ADD CONSTRAINT "EtogetherActivity_organiserId_fkey" FOREIGN KEY ("organiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivityRegister" ADD CONSTRAINT "EtogetherActivityRegister_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "EtogetherActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivityRegister" ADD CONSTRAINT "EtogetherActivityRegister_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivityRegister" ADD CONSTRAINT "EtogetherActivityRegister_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "EtogetherActivitySubgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityRegister" ADD CONSTRAINT "ExternalEtogetherActivityRegister_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "EtogetherActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityRegister" ADD CONSTRAINT "ExternalEtogetherActivityRegister_mainRegisterId_fkey" FOREIGN KEY ("mainRegisterId") REFERENCES "EtogetherActivityRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityRegister" ADD CONSTRAINT "ExternalEtogetherActivityRegister_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "EtogetherActivitySubgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" ADD CONSTRAINT "EtogetherActivityCheckRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "EtogetherActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" ADD CONSTRAINT "EtogetherActivityCheckRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" ADD CONSTRAINT "EtogetherActivityCheckRecord_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "EtogetherActivitySubgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" ADD CONSTRAINT "ExternalEtogetherActivityCheckRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "EtogetherActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" ADD CONSTRAINT "ExternalEtogetherActivityCheckRecord_mainCheckRecordId_fkey" FOREIGN KEY ("mainCheckRecordId") REFERENCES "EtogetherActivityCheckRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" ADD CONSTRAINT "ExternalEtogetherActivityCheckRecord_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "EtogetherActivitySubgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
