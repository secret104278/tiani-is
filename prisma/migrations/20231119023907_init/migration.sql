-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TIANI_ADMIN', 'VOLUNTEER_ADMIN', 'YIDECLASS_ADMIN');

-- CreateEnum
CREATE TYPE "VolunteerActivityStatus" AS ENUM ('DRAFT', 'INREVIEW', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "VolunteerActivityCheckRecordType" AS ENUM ('CHECKIN', 'CHECKOUT');

-- CreateEnum
CREATE TYPE "ClassActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Example" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "roles" "Role"[] DEFAULT ARRAY[]::"Role"[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VolunteerActivity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "headcount" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "status" "VolunteerActivityStatus" NOT NULL DEFAULT 'INREVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organiserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "VolunteerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReviewer" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ActivityReviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerActivityCheckRecord" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "type" "VolunteerActivityCheckRecordType" NOT NULL,
    "checkAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "VolunteerActivityCheckRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasualCheckRecord" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "CasualCheckRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassActivity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "status" "ClassActivityStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organiserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ClassActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassActivityCheckRecord" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "checkAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "ClassActivityCheckRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipatedVolunteerActivites" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "Example_name_idx" ON "Example"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "VolunteerActivity_organiserId_idx" ON "VolunteerActivity"("organiserId");

-- CreateIndex
CREATE INDEX "VolunteerActivity_startDateTime_idx" ON "VolunteerActivity"("startDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReviewer_userId_key" ON "ActivityReviewer"("userId");

-- CreateIndex
CREATE INDEX "VolunteerActivityCheckRecord_userId_idx" ON "VolunteerActivityCheckRecord"("userId");

-- CreateIndex
CREATE INDEX "VolunteerActivityCheckRecord_activityId_idx" ON "VolunteerActivityCheckRecord"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerActivityCheckRecord_userId_activityId_type_key" ON "VolunteerActivityCheckRecord"("userId", "activityId", "type");

-- CreateIndex
CREATE INDEX "CasualCheckRecord_userId_checkInAt_idx" ON "CasualCheckRecord"("userId", "checkInAt");

-- CreateIndex
CREATE INDEX "ClassActivity_organiserId_idx" ON "ClassActivity"("organiserId");

-- CreateIndex
CREATE INDEX "ClassActivity_startDateTime_idx" ON "ClassActivity"("startDateTime");

-- CreateIndex
CREATE INDEX "ClassActivityCheckRecord_userId_idx" ON "ClassActivityCheckRecord"("userId");

-- CreateIndex
CREATE INDEX "ClassActivityCheckRecord_activityId_idx" ON "ClassActivityCheckRecord"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassActivityCheckRecord_userId_activityId_key" ON "ClassActivityCheckRecord"("userId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipatedVolunteerActivites_AB_unique" ON "_ParticipatedVolunteerActivites"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipatedVolunteerActivites_B_index" ON "_ParticipatedVolunteerActivites"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerActivity" ADD CONSTRAINT "VolunteerActivity_organiserId_fkey" FOREIGN KEY ("organiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReviewer" ADD CONSTRAINT "ActivityReviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerActivityCheckRecord" ADD CONSTRAINT "VolunteerActivityCheckRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerActivityCheckRecord" ADD CONSTRAINT "VolunteerActivityCheckRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "VolunteerActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasualCheckRecord" ADD CONSTRAINT "CasualCheckRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassActivity" ADD CONSTRAINT "ClassActivity_organiserId_fkey" FOREIGN KEY ("organiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassActivityCheckRecord" ADD CONSTRAINT "ClassActivityCheckRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassActivityCheckRecord" ADD CONSTRAINT "ClassActivityCheckRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ClassActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipatedVolunteerActivites" ADD CONSTRAINT "_ParticipatedVolunteerActivites_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipatedVolunteerActivites" ADD CONSTRAINT "_ParticipatedVolunteerActivites_B_fkey" FOREIGN KEY ("B") REFERENCES "VolunteerActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
