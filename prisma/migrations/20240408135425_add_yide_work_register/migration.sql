-- CreateTable
CREATE TABLE "YideWorkActivityRegister" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "YideWorkActivityRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalYideWorkActivityRegister" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "mainRegisterId" INTEGER NOT NULL,

    CONSTRAINT "ExternalYideWorkActivityRegister_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YideWorkActivityRegister_userId_activityId_key" ON "YideWorkActivityRegister"("userId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalYideWorkActivityRegister_activityId_username_key" ON "ExternalYideWorkActivityRegister"("activityId", "username");

-- AddForeignKey
ALTER TABLE "YideWorkActivityRegister" ADD CONSTRAINT "YideWorkActivityRegister_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "YideWorkActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YideWorkActivityRegister" ADD CONSTRAINT "YideWorkActivityRegister_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalYideWorkActivityRegister" ADD CONSTRAINT "ExternalYideWorkActivityRegister_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "YideWorkActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalYideWorkActivityRegister" ADD CONSTRAINT "ExternalYideWorkActivityRegister_mainRegisterId_fkey" FOREIGN KEY ("mainRegisterId") REFERENCES "YideWorkActivityRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
