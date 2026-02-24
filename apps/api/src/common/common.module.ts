import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PracticeIsolationGuard } from './guards/practice-isolation.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PracticeIsolationGuard,
    },
  ],
})
export class CommonModule {}
