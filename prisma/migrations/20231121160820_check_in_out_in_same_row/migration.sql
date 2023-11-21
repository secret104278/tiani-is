-- AlterTable
ALTER TABLE "VolunteerActivityCheckRecord" ADD COLUMN     "checkInAt" TIMESTAMP(3),
ADD COLUMN     "checkInLatitude" DOUBLE PRECISION,
ADD COLUMN     "checkInLongitude" DOUBLE PRECISION,
ADD COLUMN     "checkOutAt" TIMESTAMP(3),
ADD COLUMN     "checkOutLatitude" DOUBLE PRECISION,
ADD COLUMN     "checkOutLongitude" DOUBLE PRECISION;
