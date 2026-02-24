import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function createMockContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: 'DOCTOR' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user is null', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has matching role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'DOCTOR']);
    const context = createMockContext({ role: 'DOCTOR' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user role does not match', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext({ role: 'DOCTOR' });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow ADMIN when ADMIN is in required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext({ role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
