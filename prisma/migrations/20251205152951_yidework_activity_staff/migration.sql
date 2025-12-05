-- CreateTable
CREATE TABLE "YideWorkActivityStaff" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "YideWorkActivityStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YideWorkActivityStaff_activityId_idx" ON "YideWorkActivityStaff"("activityId");

-- CreateIndex
CREATE INDEX "YideWorkActivityStaff_userId_idx" ON "YideWorkActivityStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "YideWorkActivityStaff_activityId_userId_key" ON "YideWorkActivityStaff"("activityId", "userId");

-- AddForeignKey
ALTER TABLE "YideWorkActivityStaff" ADD CONSTRAINT "YideWorkActivityStaff_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "YideWorkActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YideWorkActivityStaff" ADD CONSTRAINT "YideWorkActivityStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
