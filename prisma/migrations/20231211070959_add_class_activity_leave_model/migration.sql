-- CreateTable
CREATE TABLE "ClassActivityLeaveRecord" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,

    CONSTRAINT "ClassActivityLeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassActivityLeaveRecord_userId_idx" ON "ClassActivityLeaveRecord"("userId");

-- CreateIndex
CREATE INDEX "ClassActivityLeaveRecord_activityId_idx" ON "ClassActivityLeaveRecord"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassActivityLeaveRecord_userId_activityId_key" ON "ClassActivityLeaveRecord"("userId", "activityId");

-- AddForeignKey
ALTER TABLE "ClassActivityLeaveRecord" ADD CONSTRAINT "ClassActivityLeaveRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassActivityLeaveRecord" ADD CONSTRAINT "ClassActivityLeaveRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ClassActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
