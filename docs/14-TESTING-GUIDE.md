# Testing Guide

## Test Stack

| App | Framework | Runner | Environment |
|-----|-----------|--------|-------------|
| `apps/api` | Jest + ts-jest | `jest` | Node.js |
| `apps/web` | Vitest + React Testing Library | `vitest` | jsdom |
| `packages/shared` | Vitest | `vitest` | Node.js |

## Running Tests

```bash
# Run all tests across all packages
npx pnpm test

# Run specific workspace tests
npx pnpm test:api       # Backend tests (Jest)
npx pnpm test:shared    # Shared package tests (Vitest)

# Run with coverage
npx pnpm test:coverage

# Watch mode
npx pnpm --filter api run test:watch
npx pnpm --filter shared run test:watch
```

---

## Backend Testing Patterns (Jest)

### Module Setup

All backend tests use NestJS's `Test.createTestingModule` with mock providers:

```typescript
import { Test } from '@nestjs/testing';
import { createMockPrismaService } from '../test/prisma-mock.factory';

let service: MyService;
let prisma: MockPrismaService;

beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      MyService,
      { provide: PrismaService, useFactory: createMockPrismaService },
    ],
  }).compile();

  service = module.get(MyService);
  prisma = module.get(PrismaService) as unknown as MockPrismaService;
});
```

### Prisma Mock Factory

**File:** `apps/api/src/test/prisma-mock.factory.ts`

Provides a complete mock of `PrismaService` with all model methods:

```typescript
// Creates a mock for one Prisma model
function createMockModel() {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}

// Creates the full mock PrismaService
function createMockPrismaService() {
  return {
    practice: createMockModel(),
    doctor: createMockModel(),
    patient: createMockModel(),
    scanSession: createMockModel(),
    scanImage: createMockModel(),
    tagSet: createMockModel(),
    messageThread: createMockModel(),
    message: createMockModel(),
    auditLog: createMockModel(),
    patientInvite: createMockModel(),
    $transaction: jest.fn(),
  };
}

// Convenience provider
function provideMockPrisma() {
  return { provide: PrismaService, useFactory: createMockPrismaService };
}
```

**Transaction mock:** Handles both array form (`Promise.all(...)`) and callback form (`(cb) => cb(prisma)`).

### Common Mock Patterns

```typescript
// Mock a successful query
prisma.patient.findMany.mockResolvedValueOnce([mockPatient]);
prisma.patient.count.mockResolvedValueOnce(1);

// Mock a not-found scenario
prisma.scanSession.findFirst.mockResolvedValueOnce(null);

// Mock a rejection
prisma.doctor.create.mockRejectedValueOnce(new Error('duplicate'));

// Mock a transaction
prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
```

### Assertions

```typescript
// Verify service method was called
expect(prisma.patient.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: { practiceId: 'practice-1' },
  }),
);

// Verify correct result
const result = await service.findAll('practice-1', query);
expect(result.items).toHaveLength(2);

// Verify exceptions
await expect(service.findOne('id', 'wrong-practice')).rejects.toThrow(NotFoundException);
```

---

## Frontend Testing Patterns (Vitest)

### Setup

**Config:** `apps/web/vitest.config.ts`

```typescript
{
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
}
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';

test('renders patient table', () => {
  render(<PatientTable patients={mockPatients} />);
  expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  expect(screen.getByRole('table')).toBeInTheDocument();
});
```

### Query Patterns

```typescript
// Find element by text
screen.getByText('Submit');

// Find by role
screen.getByRole('button', { name: /submit/i });

// Assert absence
expect(screen.queryByText('Error')).not.toBeInTheDocument();

// Loading state
expect(screen.getByTestId('skeleton')).toBeInTheDocument();
```

---

## Coverage Configuration

### Backend (Jest)

**File:** `apps/api/jest.config.js`

```javascript
collectCoverageFrom: [
  '**/*.service.ts',
  '**/guards/*.ts',
  '**/filters/*.ts',
  '**/interceptors/*.ts',
  '!**/*.module.ts',
  '!**/dto/**',
  '!**/main.ts',
]
```

Covers: services, guards, filters, interceptors. Excludes: modules, DTOs, main.ts.

### Frontend (Vitest)

```typescript
coverage: {
  include: ['src/lib/**', 'src/components/**'],
  exclude: ['src/lib/types.ts', 'src/test/**'],
}
```

---

## Test File Inventory

### Backend Tests (apps/api, Jest) — 18 files, ~120 test cases

| Module | File | Cases | Covers |
|--------|------|-------|--------|
| Auth | `auth.service.spec.ts` | ~78 | register, login, token gen, Auth0 |
| Common/Filters | `http-exception.filter.spec.ts` | 6 | HTTP error mapping |
| Common/Filters | `prisma-exception.filter.spec.ts` | 4 | Prisma error mapping |
| Common/Guards | `jwt-auth.guard.spec.ts` | 3 | @Public, JWT validation |
| Common/Guards | `roles.guard.spec.ts` | 5 | Role checking |
| Common/Guards | `practice-isolation.guard.spec.ts` | 7 | Multi-tenant isolation |
| Common/Interceptors | `transform.interceptor.spec.ts` | 5 | Response wrapping |
| Common/Interceptors | `audit-log.interceptor.spec.ts` | 5 | Mutation logging |
| Common/Storage | `storage.service.spec.ts` | 16 | S3 operations, local fallback |
| Scans | `scans.service.spec.ts` | 5 | Sessions CRUD |
| Scans | `upload.service.spec.ts` | 13 | Upload URLs, confirm, local |
| Scans | `thumbnail.service.spec.ts` | 12 | Sharp resize, S3 store |
| Patients | `patients.service.spec.ts` | 8 | CRUD, search, pagination |
| Tagging | `tagging.service.spec.ts` | 7 | Tag creation, AI suggest |
| Tagging | `tagging-analytics.service.spec.ts` | 9 | Rate calc, discount tiers |
| Messaging | `messaging.service.spec.ts` | 10 | Threads, messages, read |
| Dashboard | `dashboard.service.spec.ts` | 12 | Feed, compliance, summary |
| Practices | `practices.service.spec.ts` | 6 | CRUD, admin scoping |

### Frontend Tests (apps/web, Vitest) — 2 files, ~13 test cases

| File | Cases | Covers |
|------|-------|--------|
| `patient-form.test.tsx` | 5 | Field rendering, validation |
| `patient-table.test.tsx` | 8 | Data display, pagination, loading |

### Shared Package Tests (Vitest) — 1 file, 13 test cases

| File | Cases | Covers |
|------|-------|--------|
| `tags.test.ts` | 13 | Constants validation, tier coverage |

---

## Tips

1. **Stop dev server before running tests** on Windows if you get Prisma DLL lock errors
2. **Mock factory pattern** keeps tests consistent — always use `createMockPrismaService()`
3. **Non-mocked services** need their own mock factories (e.g., StorageService, AiService, JwtService)
4. **Transaction testing** — the mock supports both `$transaction([...])` (array) and `$transaction((prisma) => ...)` (callback) forms
5. **Frontend tests** are minimal — focus on component rendering and data display. No MSW/API mocking yet.
