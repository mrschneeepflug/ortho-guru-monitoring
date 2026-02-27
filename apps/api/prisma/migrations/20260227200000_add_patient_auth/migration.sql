-- AlterTable
ALTER TABLE "patients" ADD COLUMN "email" TEXT,
ADD COLUMN "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "patient_invites" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patient_invites_token_key" ON "patient_invites"("token");

-- CreateIndex
CREATE INDEX "patient_invites_token_idx" ON "patient_invites"("token");

-- AddForeignKey
ALTER TABLE "patient_invites" ADD CONSTRAINT "patient_invites_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
