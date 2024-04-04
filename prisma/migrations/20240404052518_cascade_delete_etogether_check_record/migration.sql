-- DropForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" DROP CONSTRAINT "EtogetherActivityCheckRecord_registerId_fkey";

-- DropForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" DROP CONSTRAINT "ExternalEtogetherActivityCheckRecord_registerId_fkey";

-- AddForeignKey
ALTER TABLE "EtogetherActivityCheckRecord" ADD CONSTRAINT "EtogetherActivityCheckRecord_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "EtogetherActivityRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityCheckRecord" ADD CONSTRAINT "ExternalEtogetherActivityCheckRecord_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "ExternalEtogetherActivityRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
