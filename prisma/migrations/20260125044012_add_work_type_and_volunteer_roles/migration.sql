-- CreateEnum
CREATE TYPE "YideWorkType" AS ENUM ('OFFERING', 'TAO', 'CEREMONY', 'OTHER');

-- AlterTable
ALTER TABLE "YideWorkActivity" ADD COLUMN     "workType" "YideWorkType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "YideWorkActivityStaff" ADD COLUMN     "volunteerRoles" JSONB;
