/*
  Warnings:

  - You are about to drop the column `professionalName` on the `MealPlan` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `MealPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MealPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "calories" INTEGER;

-- AlterTable
ALTER TABLE "MealPlan" DROP COLUMN "professionalName",
ADD COLUMN     "dailyWaterLiters" DOUBLE PRECISION,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "nutritionistId" TEXT,
ADD COLUMN     "status" "MealPlanStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
