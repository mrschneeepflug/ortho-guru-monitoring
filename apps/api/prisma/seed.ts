import { PrismaClient, DoctorRole, PatientStatus, ScanStatus, SenderType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── Practice ──────────────────────────────────────────
  const practice = await prisma.practice.upsert({
    where: { id: 'seed-practice-001' },
    update: {
      name: 'Smile Orthodontics',
      address: '123 Main St',
      subscriptionTier: 'professional',
    },
    create: {
      id: 'seed-practice-001',
      name: 'Smile Orthodontics',
      address: '123 Main St',
      subscriptionTier: 'professional',
    },
  });
  console.log(`  Practice: ${practice.name} (${practice.id})`);

  // ─── Doctors ───────────────────────────────────────────
  const drChen = await prisma.doctor.upsert({
    where: { email: 'admin@orthomonitor.dev' },
    update: {
      name: 'Dr. Sarah Chen',
      role: DoctorRole.ADMIN,
      passwordHash,
      practiceId: practice.id,
    },
    create: {
      id: 'seed-doctor-001',
      practiceId: practice.id,
      name: 'Dr. Sarah Chen',
      email: 'admin@orthomonitor.dev',
      role: DoctorRole.ADMIN,
      passwordHash,
    },
  });
  console.log(`  Doctor (ADMIN): ${drChen.name} (${drChen.id})`);

  const drWilson = await prisma.doctor.upsert({
    where: { email: 'doctor@orthomonitor.dev' },
    update: {
      name: 'Dr. James Wilson',
      role: DoctorRole.DOCTOR,
      passwordHash,
      practiceId: practice.id,
    },
    create: {
      id: 'seed-doctor-002',
      practiceId: practice.id,
      name: 'Dr. James Wilson',
      email: 'doctor@orthomonitor.dev',
      role: DoctorRole.DOCTOR,
      passwordHash,
    },
  });
  console.log(`  Doctor (DOCTOR): ${drWilson.name} (${drWilson.id})`);

  // ─── Patients ──────────────────────────────────────────
  const patientPasswordHash = await bcrypt.hash('patient123', 10);

  const patientData = [
    {
      id: 'seed-patient-001',
      practiceId: practice.id,
      doctorId: drChen.id,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash: patientPasswordHash,
      dateOfBirth: new Date('1998-03-15'),
      treatmentType: 'Invisalign',
      alignerBrand: 'Invisalign',
      currentStage: 8,
      totalStages: 22,
      scanFrequency: 14,
      status: PatientStatus.ACTIVE,
    },
    {
      id: 'seed-patient-002',
      practiceId: practice.id,
      doctorId: drWilson.id,
      name: 'Bob Martinez',
      dateOfBirth: new Date('2005-07-22'),
      treatmentType: 'Braces',
      alignerBrand: null,
      currentStage: 3,
      totalStages: 18,
      scanFrequency: 28,
      status: PatientStatus.ACTIVE,
    },
    {
      id: 'seed-patient-003',
      practiceId: practice.id,
      doctorId: drChen.id,
      name: 'Carol Nguyen',
      dateOfBirth: new Date('1992-11-08'),
      treatmentType: 'Invisalign',
      alignerBrand: 'ClearCorrect',
      currentStage: 15,
      totalStages: 30,
      scanFrequency: 14,
      status: PatientStatus.PAUSED,
    },
    {
      id: 'seed-patient-004',
      practiceId: practice.id,
      doctorId: drWilson.id,
      name: 'David Kim',
      dateOfBirth: new Date('2001-01-30'),
      treatmentType: 'Braces',
      alignerBrand: null,
      currentStage: 10,
      totalStages: 24,
      scanFrequency: 21,
      status: PatientStatus.ACTIVE,
    },
    {
      id: 'seed-patient-005',
      practiceId: practice.id,
      doctorId: drChen.id,
      name: 'Emily Torres',
      dateOfBirth: new Date('1995-06-12'),
      treatmentType: 'Invisalign',
      alignerBrand: 'Invisalign',
      currentStage: 1,
      totalStages: 20,
      scanFrequency: 14,
      status: PatientStatus.PAUSED,
    },
  ];

  const patients = [];
  for (const p of patientData) {
    const patient = await prisma.patient.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        doctorId: p.doctorId,
        email: (p as Record<string, unknown>).email as string | undefined,
        passwordHash: (p as Record<string, unknown>).passwordHash as string | undefined,
        treatmentType: p.treatmentType,
        alignerBrand: p.alignerBrand,
        currentStage: p.currentStage,
        totalStages: p.totalStages,
        scanFrequency: p.scanFrequency,
        status: p.status,
      },
      create: p,
    });
    patients.push(patient);
    console.log(`  Patient: ${patient.name} (${patient.status})`);
  }

  // ─── Scan Sessions ────────────────────────────────────
  // 1) PENDING scan for Alice
  const scanPending = await prisma.scanSession.upsert({
    where: { id: 'seed-scan-001' },
    update: {
      patientId: patients[0].id,
      status: ScanStatus.PENDING,
      imageCount: 5,
      reviewedById: null,
      reviewedAt: null,
    },
    create: {
      id: 'seed-scan-001',
      patientId: patients[0].id,
      status: ScanStatus.PENDING,
      imageCount: 5,
    },
  });
  console.log(`  Scan (PENDING): ${scanPending.id}`);

  // 2) REVIEWED scan for Bob
  const reviewedAt = new Date('2026-02-20T14:30:00Z');
  const scanReviewed = await prisma.scanSession.upsert({
    where: { id: 'seed-scan-002' },
    update: {
      patientId: patients[1].id,
      status: ScanStatus.REVIEWED,
      imageCount: 5,
      reviewedById: drChen.id,
      reviewedAt,
    },
    create: {
      id: 'seed-scan-002',
      patientId: patients[1].id,
      status: ScanStatus.REVIEWED,
      imageCount: 5,
      reviewedById: drChen.id,
      reviewedAt,
    },
  });
  console.log(`  Scan (REVIEWED): ${scanReviewed.id}`);

  // 3) FLAGGED scan for Carol
  const scanFlagged = await prisma.scanSession.upsert({
    where: { id: 'seed-scan-003' },
    update: {
      patientId: patients[2].id,
      status: ScanStatus.FLAGGED,
      imageCount: 3,
      reviewedById: null,
      reviewedAt: null,
    },
    create: {
      id: 'seed-scan-003',
      patientId: patients[2].id,
      status: ScanStatus.FLAGGED,
      imageCount: 3,
    },
  });
  console.log(`  Scan (FLAGGED): ${scanFlagged.id}`);

  // ─── Tag Set for REVIEWED session ─────────────────────
  const tagSet = await prisma.tagSet.upsert({
    where: { sessionId: scanReviewed.id },
    update: {
      taggedById: drChen.id,
      overallTracking: 2,
      alignerFit: 1,
      oralHygiene: 2,
    },
    create: {
      id: 'seed-tagset-001',
      sessionId: scanReviewed.id,
      taggedById: drChen.id,
      overallTracking: 2,
      alignerFit: 1,
      oralHygiene: 2,
    },
  });
  console.log(`  TagSet: tracking=${tagSet.overallTracking}, fit=${tagSet.alignerFit}, hygiene=${tagSet.oralHygiene}`);

  // ─── Message Thread & Messages ────────────────────────
  const thread = await prisma.messageThread.upsert({
    where: { id: 'seed-thread-001' },
    update: {
      patientId: patients[0].id,
      subject: 'Aligner fit concern',
      isActive: true,
    },
    create: {
      id: 'seed-thread-001',
      patientId: patients[0].id,
      subject: 'Aligner fit concern',
      isActive: true,
    },
  });
  console.log(`  Thread: "${thread.subject}" (${thread.id})`);

  // Delete existing messages in this thread before re-creating to avoid duplicates
  await prisma.message.deleteMany({
    where: { threadId: thread.id },
  });

  const msgDoctor = await prisma.message.create({
    data: {
      id: 'seed-msg-001',
      threadId: thread.id,
      senderType: SenderType.DOCTOR,
      senderId: drChen.id,
      content:
        'Hi Alice, I noticed your latest scan shows a slight gap on the upper left. Are you wearing your aligners for the full 22 hours per day?',
    },
  });
  console.log(`  Message (DOCTOR): ${msgDoctor.id}`);

  const msgPatient = await prisma.message.create({
    data: {
      id: 'seed-msg-002',
      threadId: thread.id,
      senderType: SenderType.PATIENT,
      senderId: patients[0].id,
      content:
        'Hi Dr. Chen, I have been trying to keep them in but I sometimes take them out during lunch and forget to put them back for a while. I will be more careful!',
    },
  });
  console.log(`  Message (PATIENT): ${msgPatient.id}`);

  console.log(`\n  Patient login: alice@example.com / patient123`);
  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
