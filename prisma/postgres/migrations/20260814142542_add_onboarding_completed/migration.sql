/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."UserPreference" DROP CONSTRAINT "UserPreference_preferredLanguageId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_username_key" ON "UserProfile"("username");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_preferredLanguageId_fkey" FOREIGN KEY ("preferredLanguageId") REFERENCES "ProgrammingLanguage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
