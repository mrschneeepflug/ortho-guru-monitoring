-- CreateEnum
CREATE TYPE "AttachmentCheck" AS ENUM ('YES', 'NO', 'UNSURE');

-- AlterTable
ALTER TABLE "scan_sessions" ADD COLUMN     "reportAlignerFit" INTEGER,
ADD COLUMN     "reportAttachments" "AttachmentCheck",
ADD COLUMN     "reportNotes" TEXT,
ADD COLUMN     "reportTrayNumber" INTEGER,
ADD COLUMN     "reportWearTimeHrs" INTEGER;
