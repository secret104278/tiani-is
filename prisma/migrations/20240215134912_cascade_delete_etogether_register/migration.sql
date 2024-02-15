-- DropForeignKey
ALTER TABLE "ExternalEtogetherActivityRegister" DROP CONSTRAINT "ExternalEtogetherActivityRegister_mainRegisterId_fkey";

-- AddForeignKey
ALTER TABLE "ExternalEtogetherActivityRegister" ADD CONSTRAINT "ExternalEtogetherActivityRegister_mainRegisterId_fkey" FOREIGN KEY ("mainRegisterId") REFERENCES "EtogetherActivityRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
