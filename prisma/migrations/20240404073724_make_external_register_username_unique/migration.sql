/*
  Warnings:

  - A unique constraint covering the columns `[activityId,username]` on the table `ExternalEtogetherActivityRegister` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExternalEtogetherActivityRegister_activityId_username_key" ON "ExternalEtogetherActivityRegister"("activityId", "username");
