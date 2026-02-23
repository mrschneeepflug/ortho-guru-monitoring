import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class PracticeIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.practiceId) {
      return true; // Skip for unauthenticated routes
    }

    // Inject practiceId into request for downstream use
    request.practiceId = user.practiceId;

    // If a practiceId param exists in the route, verify it matches
    const paramPracticeId = request.params?.practiceId;
    if (paramPracticeId && paramPracticeId !== user.practiceId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return true;
  }
}
