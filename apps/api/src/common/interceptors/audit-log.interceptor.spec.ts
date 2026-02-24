import { of } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let prisma: { auditLog: { create: jest.Mock } };

  beforeEach(() => {
    prisma = { auditLog: { create: jest.fn().mockResolvedValue({}) } };
    interceptor = new AuditLogInterceptor(prisma as unknown as PrismaService);
  });

  function createMockContext(
    method: string,
    user?: Record<string, unknown>,
  ): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method,
          user,
          params: { id: 'r1' },
          route: { path: '/api/v1/patients/:id' },
          ip: '127.0.0.1',
        }),
        getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
  }

  function createHandler(data: unknown = {}): CallHandler {
    return { handle: () => of(data) };
  }

  it('should skip logging for GET requests', (done) => {
    const context = createMockContext('GET', { sub: 'u1', role: 'DOCTOR', practiceId: 'p1' });

    interceptor.intercept(context, createHandler()).subscribe(() => {
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      done();
    });
  });

  it('should skip logging when no user is present', (done) => {
    const context = createMockContext('POST', undefined);

    interceptor.intercept(context, createHandler()).subscribe(() => {
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      done();
    });
  });

  it('should create audit log for POST requests', (done) => {
    const context = createMockContext('POST', {
      sub: 'u1',
      role: 'DOCTOR',
      practiceId: 'p1',
    });

    interceptor.intercept(context, createHandler({ data: { id: 'new1' } })).subscribe(() => {
      // audit log is async, give it a tick
      setTimeout(() => {
        expect(prisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: 'u1',
            userRole: 'DOCTOR',
            practiceId: 'p1',
            resourceId: 'new1',
          }),
        });
        done();
      }, 10);
    });
  });

  it('should log DELETE requests', (done) => {
    const context = createMockContext('DELETE', {
      sub: 'u1',
      role: 'ADMIN',
      practiceId: 'p1',
    });

    interceptor.intercept(context, createHandler()).subscribe(() => {
      setTimeout(() => {
        expect(prisma.auditLog.create).toHaveBeenCalled();
        const call = prisma.auditLog.create.mock.calls[0][0];
        expect(call.data.action).toContain('DELETE');
        done();
      }, 10);
    });
  });

  it('should not fail the request if audit logging throws', (done) => {
    prisma.auditLog.create.mockRejectedValueOnce(new Error('DB down'));
    const context = createMockContext('POST', {
      sub: 'u1',
      role: 'DOCTOR',
      practiceId: 'p1',
    });

    interceptor.intercept(context, createHandler()).subscribe({
      next: () => {
        // Should still complete normally
        done();
      },
      error: () => {
        done.fail('Should not have errored');
      },
    });
  });
});
