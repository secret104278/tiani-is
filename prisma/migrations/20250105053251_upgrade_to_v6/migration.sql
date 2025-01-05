-- AlterTable
ALTER TABLE "_ParticipatedVolunteerActivites" ADD CONSTRAINT "_ParticipatedVolunteerActivites_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ParticipatedVolunteerActivites_AB_unique";
