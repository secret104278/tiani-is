-- CreateTable
CREATE TABLE "ClassMemberEnrollment" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "classTitle" TEXT NOT NULL,

    CONSTRAINT "ClassMemberEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassMemberEnrollment_classTitle_idx" ON "ClassMemberEnrollment"("classTitle");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMemberEnrollment_userId_classTitle_key" ON "ClassMemberEnrollment"("userId", "classTitle");

-- AddForeignKey
ALTER TABLE "ClassMemberEnrollment" ADD CONSTRAINT "ClassMemberEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
