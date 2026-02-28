# Common Module

**Path:** `apps/api/src/common/`

The Common module provides cross-cutting infrastructure that applies to every request: authentication, authorization, response formatting, audit logging, error handling, database access, cloud storage, and AI integration.

## Module Registration

**File:** `apps/api/src/common/common.module.ts`

```typescript
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PracticeIsolationGuard },
  ],
})
export class CommonModule {}
```

This registers guards, interceptors, and filters globally using NestJS's `APP_*` tokens. They apply to every route without needing per-controller decoration.

---

## Guards

### JwtAuthGuard

**File:** `common/guards/jwt-auth.guard.ts`

Extends Passport's `AuthGuard('jwt')`. Applied globally.

**Behavior:**
1. Checks handler/class metadata for `@Public()` decorator via Reflector
2. If public → allows request immediately
3. Otherwise → delegates to Passport JWT validation
4. On success → populates `request.user` with decoded JWT payload

```typescript
canActivate(context: ExecutionContext) {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  if (isPublic) return true;
  return super.canActivate(context);
}
```

### PracticeIsolationGuard

**File:** `common/guards/practice-isolation.guard.ts`

Enforces multi-tenant data isolation. Applied globally.

**Behavior:**
1. If no user (unauthenticated/public route) → pass through
2. Extracts `practiceId` from JWT and sets `request.practiceId`
3. If route has `:practiceId` param → validates it matches JWT's practiceId
4. Throws `ForbiddenException('Cross-tenant access denied')` on mismatch

### PatientAuthGuard

**File:** `common/guards/patient-auth.guard.ts`

Applied per-controller with `@UseGuards(PatientAuthGuard)`.

**Behavior:**
1. Runs parent JWT validation first
2. Checks `isPatientPayload(request.user)` — verifies `type: 'patient'`
3. Throws `ForbiddenException('This endpoint is for patients only')` if not a patient token

### RolesGuard

**File:** `common/guards/roles.guard.ts`

Applied per-route with `@UseGuards(RolesGuard)` + `@Roles(...)`.

**Behavior:**
1. Reads `@Roles()` metadata from handler/class
2. If no roles required → allows request
3. Checks `user.role` against required roles list
4. Returns `false` if user is null or role doesn't match

---

## Interceptors

### TransformInterceptor

**File:** `common/interceptors/transform.interceptor.ts`

Wraps all responses in a consistent `{ data, meta? }` format.

**Behavior:**
- If response already has a `data` property → returns as-is (idempotent)
- Otherwise → wraps in `{ data: response }`
- Applied to all routes (global)

**Response format:**
```json
{ "data": { ... }, "meta": { ... } }
```

### AuditLogInterceptor

**File:** `common/interceptors/audit-log.interceptor.ts`

Logs all mutation requests (POST, PUT, PATCH, DELETE) to the `audit_logs` table.

**Behavior:**
1. Skips GET/HEAD requests
2. Skips requests without authenticated user
3. Records start time
4. After handler completes → creates `AuditLog` record with:
   - `userId`, `userRole` (from JWT)
   - `action` (e.g., "POST /auth/login")
   - `resourceType` (from URL path)
   - `resourceId` (from response.data.id or URL params)
   - `practiceId`, `ipAddress`
   - `metadata`: `{ duration, statusCode }`
5. Audit logging is non-blocking and non-fatal (catches errors silently)

---

## Filters

### PrismaExceptionFilter

**File:** `common/filters/prisma-exception.filter.ts`

Catches `Prisma.PrismaClientKnownRequestError` and maps to HTTP responses:

| Prisma Code | HTTP Status | Message |
|-------------|-------------|---------|
| `P2002` | 409 Conflict | "A record with this value already exists" |
| `P2025` | 404 Not Found | "Record not found" |
| `P2003` | 400 Bad Request | "Foreign key constraint failed" |
| default | 500 Internal Server Error | "Database error" |

**Response format:**
```json
{ "statusCode": 409, "message": "A record with this value already exists", "timestamp": "..." }
```

### HttpExceptionFilter

**File:** `common/filters/http-exception.filter.ts`

Catches all `HttpException` instances and standardizes the error response.

**Behavior:**
- Extracts status code and exception response
- Normalizes string responses to `{ message: string }`
- Returns: `{ statusCode, timestamp, ...errorDetails }`

---

## Decorators

### @Public()

**File:** `common/decorators/public.decorator.ts`

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Marks a route as public. `JwtAuthGuard` checks this metadata and skips JWT validation.

### @CurrentUser(field?)

**File:** `common/decorators/current-user.decorator.ts`

Extracts JWT payload from `request.user`. Optionally returns a specific field.

```typescript
// Full payload
@CurrentUser() user: JwtPayload

// Single field
@CurrentUser('practiceId') practiceId: string
```

### @CurrentPatient(field?)

**File:** `common/decorators/current-patient.decorator.ts`

Extracts patient JWT payload from `request.user`. Typed as `PatientJwtPayload`.

```typescript
@CurrentPatient() patient: PatientJwtPayload
@CurrentPatient('patientId') patientId: string
```

### @Roles(...roles)

**File:** `common/decorators/roles.decorator.ts`

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

Sets required roles metadata. Used with `RolesGuard`.

---

## JWT Payload Interfaces

**File:** `common/interfaces/jwt-payload.interface.ts`

```typescript
interface DoctorJwtPayload {
  sub: string;         // doctorId
  email: string;
  role: string;
  practiceId: string;
  type: 'doctor';
}

interface PatientJwtPayload {
  sub: string;         // patientId
  patientId: string;
  email: string;
  practiceId: string;
  type: 'patient';
}

type JwtPayload = DoctorJwtPayload | PatientJwtPayload;
```

**Type guards:**
- `isDoctorPayload(p)` → `p.type === 'doctor'` (also handles legacy tokens without `type`)
- `isPatientPayload(p)` → `p.type === 'patient'`

---

## PrismaModule / PrismaService

**Files:** `common/prisma/prisma.module.ts`, `common/prisma/prisma.service.ts`

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`PrismaService` extends `PrismaClient` and implements lifecycle hooks:
- `onModuleInit()` → `$connect()`
- `onModuleDestroy()` → `$disconnect()`

Available globally — no need to import PrismaModule in feature modules.

---

## StorageModule / StorageService

**Files:** `common/storage/storage.module.ts`, `common/storage/storage.service.ts`

```typescript
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

See [Storage System](./09-STORAGE-SYSTEM.md) for full details.

---

## RefreshTokenModule

**Files:** `common/refresh-token/refresh-token.module.ts`, `common/refresh-token/refresh-token.service.ts`, `common/refresh-token/redis.service.ts`, `common/refresh-token/cookie.helper.ts`, `common/refresh-token/refresh-token.constants.ts`

```typescript
@Global()
@Module({
  providers: [RedisService, RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
```

Provides rotate-on-use refresh tokens with token family tracking and stolen token detection. Uses Redis for hot-path lookups and PostgreSQL for durability.

**Key services:**
- `RedisService` — thin ioredis wrapper (`get`, `set`, `del`, `sadd`, `smembers`, `srem`, `expire`). Connects to `REDIS_URL` env var.
- `RefreshTokenService` — `createRefreshToken()`, `rotateRefreshToken()`, `revokeFamily()`, `revokeAllUserTokens()`, `getFamilyIdByToken()`, `purgeExpired()`. Runs daily expired-token purge via `setInterval`.
- `setRefreshCookie()` / `clearRefreshCookie()` — helper functions for httpOnly cookie management.

See [Authentication System](./05-AUTHENTICATION-SYSTEM.md#refresh-tokens) for full details.

---

## AiModule / AiService

**Files:** `common/ai/ai.module.ts`, `common/ai/ai.service.ts`

```typescript
@Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
```

See [AI Tagging System](./10-AI-TAGGING-SYSTEM.md) for full details.

---

## Execution Order Summary

```
REQUEST IN
  → cookie-parser middleware (parse cookies including refresh tokens)
  → JwtAuthGuard (validate JWT, skip if @Public)
  → PracticeIsolationGuard (inject practiceId, block cross-tenant)
  → ValidationPipe (validate DTOs)
  → Controller Handler
  → TransformInterceptor (wrap { data, meta })
  → AuditLogInterceptor (log mutations)
RESPONSE OUT

ON ERROR:
  → PrismaExceptionFilter (P2002/P2025/P2003)
  → HttpExceptionFilter (all HttpException subclasses)
```
