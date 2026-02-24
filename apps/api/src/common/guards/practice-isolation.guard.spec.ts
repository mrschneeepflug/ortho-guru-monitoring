import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PracticeIsolationGuard } from './practice-isolation.guard';

describe('PracticeIsolationGuard', () => {
  let guard: PracticeIsolationGuard;

  beforeEach(() => {
    guard = new PracticeIsolationGuard();
  });

  function createMockContext(
    user?: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): { context: ExecutionContext; request: Record<string, unknown> } {
    const request: Record<string, unknown> = { user, params: params ?? {} };
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('should pass through when user has no practiceId (unauthenticated)', () => {
    const { context } = createMockContext({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass through when user is undefined', () => {
    const { context } = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should inject practiceId into request', () => {
    const { context, request } = createMockContext(
      { practiceId: 'p1' },
      {},
    );

    guard.canActivate(context);
    expect(request.practiceId).toBe('p1');
  });

  it('should allow access when route practiceId matches user practiceId', () => {
    const { context } = createMockContext(
      { practiceId: 'p1' },
      { practiceId: 'p1' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException for cross-tenant access', () => {
    const { context } = createMockContext(
      { practiceId: 'p1' },
      { practiceId: 'p2' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when no practiceId param in route', () => {
    const { context } = createMockContext(
      { practiceId: 'p1' },
      {},
    );

    expect(guard.canActivate(context)).toBe(true);
  });
});
