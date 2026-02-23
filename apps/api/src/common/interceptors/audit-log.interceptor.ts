import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only log mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const resourceId =
            responseData?.data?.id || request.params?.id || null;
          const pathParts = request.route?.path?.split('/').filter(Boolean) || [];
          const resourceType = pathParts.find(
            (p: string) => !p.startsWith(':') && p !== 'api' && p !== 'v1',
          ) || 'unknown';

          await this.prisma.auditLog.create({
            data: {
              userId: user.sub,
              userRole: user.role,
              action: `${method} ${request.route?.path || request.url}`,
              resourceType,
              resourceId,
              practiceId: user.practiceId,
              ipAddress: request.ip,
              metadata: {
                duration: Date.now() - startTime,
                statusCode: context.switchToHttp().getResponse().statusCode,
              },
            },
          });
        } catch {
          // Don't fail the request if audit logging fails
          console.error('Audit log failed');
        }
      }),
    );
  }
}
