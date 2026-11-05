-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "TrainingItem" ADD COLUMN     "exerciseId" TEXT;

-- AddForeignKey
ALTER TABLE "TrainingItem" ADD CONSTRAINT "TrainingItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
