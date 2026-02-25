import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';

const TEST_DATABASE_URL =
  'postgresql://ortho:ortho_secret@localhost:5432/orthomonitor_test';

module.exports = async function globalSetup() {
  console.log('\n[E2E Setup] Starting...');

  // 1. Create test database (ignore if already exists)
  try {
    execSync(
      'docker exec ortho-postgres psql -U ortho -d postgres -c "CREATE DATABASE orthomonitor_test;"',
      { stdio: 'pipe' },
    );
    console.log('[E2E Setup] Created test database');
  } catch {
    console.log('[E2E Setup] Test database already exists');
  }

  // 2. Push Prisma schema to test database
  const apiDir = path.resolve(__dirname, '..');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    cwd: apiDir,
    stdio: 'inherit',
  });
  console.log('[E2E Setup] Schema pushed');

  // 3. Seed baseline data
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });
  await prisma.$connect();

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.practice.upsert({
    where: { id: 'e2e-practice-001' },
    update: {},
    create: {
      id: 'e2e-practice-001',
      name: 'E2E Test Practice',
      address: '123 Test St',
      phone: '555-0100',
      subscriptionTier: 'professional',
    },
  });

  await prisma.doctor.upsert({
    where: { email: 'admin-e2e@test.com' },
    update: {},
    create: {
      id: 'e2e-doctor-admin',
      practiceId: 'e2e-practice-001',
      name: 'E2E Admin Doctor',
      email: 'admin-e2e@test.com',
      role: 'ADMIN',
      passwordHash,
    },
  });

  await prisma.doctor.upsert({
    where: { email: 'doctor-e2e@test.com' },
    update: {},
    create: {
      id: 'e2e-doctor-regular',
      practiceId: 'e2e-practice-001',
      name: 'E2E Regular Doctor',
      email: 'doctor-e2e@test.com',
      role: 'DOCTOR',
      passwordHash,
    },
  });

  await prisma.$disconnect();
  console.log('[E2E Setup] Baseline seeded (1 practice, 2 doctors)');
};
