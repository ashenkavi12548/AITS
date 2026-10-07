-- AlterTable
ALTER TABLE "FarmUser" ADD COLUMN     "managerId" UUID,
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "FarmUser" ADD CONSTRAINT "FarmUser_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "FarmUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
