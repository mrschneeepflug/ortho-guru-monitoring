import { PrismaService } from '../common/prisma/prisma.service';

type MockModel = {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
};

function createMockModel(): MockModel {
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

export type MockPrismaService = {
  [K in
    | 'practice'
    | 'doctor'
    | 'patient'
    | 'scanSession'
    | 'scanImage'
    | 'tagSet'
    | 'messageThread'
    | 'message'
    | 'auditLog']: MockModel;
} & {
  $transaction: jest.Mock;
};

export function createMockPrismaService(): MockPrismaService {
  const mock: MockPrismaService = {
    practice: createMockModel(),
    doctor: createMockModel(),
    patient: createMockModel(),
    scanSession: createMockModel(),
    scanImage: createMockModel(),
    tagSet: createMockModel(),
    messageThread: createMockModel(),
    message: createMockModel(),
    auditLog: createMockModel(),
    $transaction: jest.fn(),
  };

  // Handle both array and callback forms of $transaction
  mock.$transaction.mockImplementation((arg: unknown) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === 'function') {
      return (arg as (prisma: MockPrismaService) => unknown)(mock);
    }
    return Promise.resolve(arg);
  });

  return mock;
}

export function provideMockPrisma() {
  return {
    provide: PrismaService,
    useFactory: createMockPrismaService,
  };
}
