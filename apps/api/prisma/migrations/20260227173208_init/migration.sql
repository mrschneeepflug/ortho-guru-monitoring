-- CreateEnum
CREATE TYPE "DoctorRole" AS ENUM ('ADMIN', 'DOCTOR', 'HYGIENIST');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'REVIEWED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('FRONT', 'LEFT', 'RIGHT', 'UPPER_OCCLUSAL', 'LOWER_OCCLUSAL');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('DOCTOR', 'PATIENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "practices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'basic',
    "taggingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "DoctorRole" NOT NULL DEFAULT 'DOCTOR',
    "credentials" TEXT,
    "passwordHash" TEXT,
    "auth0Id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "treatmentType" TEXT,
    "alignerBrand" TEXT,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "totalStages" INTEGER,
    "scanFrequency" INTEGER NOT NULL DEFAULT 14,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_sessions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_images" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "imageType" "ImageType" NOT NULL,
    "s3Key" TEXT,
    "thumbnailKey" TEXT,
    "localPath" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_sets" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "taggedById" TEXT NOT NULL,
    "overallTracking" INTEGER NOT NULL,
    "alignerFit" INTEGER,
    "oralHygiene" INTEGER NOT NULL,
    "detailTags" JSONB NOT NULL DEFAULT '[]',
    "actionTaken" TEXT,
    "notes" TEXT,
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "aiOverridden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "practiceId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_auth0Id_key" ON "doctors"("auth0Id");

-- CreateIndex
CREATE INDEX "doctors_practiceId_idx" ON "doctors"("practiceId");

-- CreateIndex
CREATE INDEX "patients_practiceId_idx" ON "patients"("practiceId");

-- CreateIndex
CREATE INDEX "patients_doctorId_idx" ON "patients"("doctorId");

-- CreateIndex
CREATE INDEX "scan_sessions_patientId_idx" ON "scan_sessions"("patientId");

-- CreateIndex
CREATE INDEX "scan_sessions_status_idx" ON "scan_sessions"("status");

-- CreateIndex
CREATE INDEX "scan_images_sessionId_idx" ON "scan_images"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_sets_sessionId_key" ON "tag_sets"("sessionId");

-- CreateIndex
CREATE INDEX "tag_sets_taggedById_idx" ON "tag_sets"("taggedById");

-- CreateIndex
CREATE INDEX "message_threads_patientId_idx" ON "message_threads"("patientId");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "audit_logs_practiceId_idx" ON "audit_logs"("practiceId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_images" ADD CONSTRAINT "scan_images_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "scan_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_sets" ADD CONSTRAINT "tag_sets_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "scan_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_sets" ADD CONSTRAINT "tag_sets_taggedById_fkey" FOREIGN KEY ("taggedById") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
