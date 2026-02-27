# Authentication System

OrthoMonitor has a dual-user authentication system supporting both doctors (staff) and patients with separate JWT token types, guards, and expiry policies.

## Architecture Overview

```
                    ┌─────────────────────┐
                    │    JWT Token         │
                    │  type: 'doctor' |   │
                    │        'patient'    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   JwtStrategy       │
                    │   (passport-jwt)    │
                    │                     │
                    │  HS256 → local      │
                    │  RS256 → Auth0      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼────┐  ┌───────▼──────┐  ┌──────▼───────┐
    │ Doctor Token  │  │Patient Token │  │ Auth0 Token  │
    │ type:'doctor' │  │type:'patient'│  │ kid header   │
    │ 7-day expiry  │  │30-day expiry │  │ RS256 JWKS   │
    └───────────────┘  └──────────────┘  └──────────────┘
```

## JWT Payload Types

The system uses a **discriminated union** based on the `type` field:

```typescript
interface DoctorJwtPayload {
  sub: string;         // doctorId
  email: string;
  role: string;        // 'ADMIN' | 'DOCTOR' | 'HYGIENIST'
  practiceId: string;
  type: 'doctor';
}

interface PatientJwtPayload {
  sub: string;         // patientId
  patientId: string;   // explicit duplicate for clarity
  email: string;
  practiceId: string;
  type: 'patient';
}

type JwtPayload = DoctorJwtPayload | PatientJwtPayload;
```

**Type guards** (`apps/api/src/common/interfaces/jwt-payload.interface.ts`):
- `isDoctorPayload(p)` — returns `true` if `type === 'doctor'` (also handles legacy tokens without `type`)
- `isPatientPayload(p)` — returns `true` if `type === 'patient'`

---

## Doctor Authentication

### Local Auth (HS256)

**Module:** `apps/api/src/auth/`

#### Registration
- **Endpoint:** `POST /api/v1/auth/register` (public)
- **Body:** `{ name, email, password, practiceId }`
- **Password:** Hashed with bcryptjs (10 salt rounds)
- **Response:** `{ accessToken, user: { id, email, name, role, practiceId } }`

#### Login
- **Endpoint:** `POST /api/v1/auth/login` (public)
- **Body:** `{ email, password }`
- **Validation:** Compares password against `doctor.passwordHash` via bcrypt
- **Response:** `{ accessToken, user: { id, email, name, role, practiceId } }`

#### Token Structure
- **Algorithm:** HS256
- **Secret:** `JWT_SECRET` env var
- **Expiry:** 7 days
- **Payload:** `{ sub, email, role, practiceId, type: 'doctor' }`

#### Get Current User
- **Endpoint:** `GET /api/v1/auth/me` (protected)
- **Response:** Full doctor profile

### Auth0 (RS256) — Optional

**Enabled when:** `AUTH0_DOMAIN` environment variable is set.

**JWT Strategy dual-mode** (`apps/api/src/auth/strategies/jwt.strategy.ts`):
1. Extracts token from `Authorization: Bearer <token>` header
2. Checks JWT header for `kid` field
3. If `kid` present AND `AUTH0_DOMAIN` configured → fetches public key from Auth0 JWKS (`https://{AUTH0_DOMAIN}/.well-known/jwks.json`)
4. If no `kid` → uses local `JWT_SECRET` for HS256 verification
5. For Auth0 tokens: validates `audience` claim against `AUTH0_AUDIENCE`
6. Auto-creates/links doctors via `findOrCreateAuth0User(auth0Sub, email, name)`

**Frontend Auth0 integration** (`apps/web/src/providers/auth-provider.tsx`):
- When `NEXT_PUBLIC_AUTH0_DOMAIN` is set, the `Auth0AuthProvider` component replaces `LocalAuthProvider`
- Uses `@auth0/auth0-react` SDK for login flow
- Auth0 button appears on the login page alongside email/password

---

## Patient Authentication

**Module:** `apps/api/src/patient-auth/`

### Invite Flow

1. **Doctor generates invite:** `POST /api/v1/patients/:id/invite`
   - Optionally pre-fills patient email
   - Creates a `PatientInvite` record with 32-byte random hex token
   - Token expires in 7 days
   - Returns: `{ token, inviteUrl, expiresAt }`
   - Invite URL format: `{PATIENT_PORTAL_URL}/register/{token}`

2. **Patient validates invite:** `GET /api/v1/patient-auth/validate-invite/:token`
   - Checks token exists, is not expired, and hasn't been used
   - Returns: `{ valid, patientName, email }`

3. **Patient registers:** `POST /api/v1/patient-auth/register`
   - Body: `{ token, email, password }` (password min 8 chars)
   - In a transaction: validates invite, hashes password, updates patient record with email + passwordHash, marks invite as used
   - Returns: `{ accessToken, patient: profile }`

### Patient Login

- **Endpoint:** `POST /api/v1/patient-auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ accessToken, patient: profile }`

### Patient Token Structure
- **Algorithm:** HS256
- **Secret:** Same `JWT_SECRET`
- **Expiry:** 30 days
- **Payload:** `{ sub, patientId, email, practiceId, type: 'patient' }`

### Patient Profile
- **Endpoint:** `GET /api/v1/patient-auth/me` (PatientAuthGuard)
- **Response:** Patient profile with doctor name

---

## Guards

### JwtAuthGuard (Global)

**File:** `apps/api/src/common/guards/jwt-auth.guard.ts`

- Applied globally via `CommonModule` (`APP_GUARD`)
- Extends Passport's `AuthGuard('jwt')`
- Checks for `@Public()` decorator — skips validation for public routes
- Populates `request.user` with decoded JWT payload

### PatientAuthGuard

**File:** `apps/api/src/common/guards/patient-auth.guard.ts`

- Applied per-controller or per-route with `@UseGuards(PatientAuthGuard)`
- First validates JWT (via parent), then checks `isPatientPayload(request.user)`
- Throws `ForbiddenException('This endpoint is for patients only')` if token is not a patient token

### RolesGuard

**File:** `apps/api/src/common/guards/roles.guard.ts`

- Applied per-route with `@UseGuards(RolesGuard)` + `@Roles('ADMIN')`
- Reads `@Roles()` metadata and checks `user.role` against required roles
- If no `@Roles()` decorator is present, allows the request

### PracticeIsolationGuard (Global)

**File:** `apps/api/src/common/guards/practice-isolation.guard.ts`

- Applied globally via `CommonModule` (`APP_GUARD`)
- Extracts `practiceId` from JWT and sets `request.practiceId`
- If route contains `:practiceId` param, validates it matches the JWT's practiceId
- Throws `ForbiddenException('Cross-tenant access denied')` on mismatch

---

## Decorators

### @Public()
Marks a route as public (bypasses `JwtAuthGuard`).
```typescript
@Post('login')
@Public()
login(@Body() dto: LoginDto) { ... }
```

### @CurrentUser()
Extracts the full JWT payload or a specific field.
```typescript
@Get('me')
getMe(@CurrentUser() user: JwtPayload) { ... }

// Or extract a field:
getSummary(@CurrentUser('practiceId') practiceId: string) { ... }
```

### @CurrentPatient()
Extracts the patient JWT payload. Used with `PatientAuthGuard`.
```typescript
@Get('profile')
@UseGuards(PatientAuthGuard)
getProfile(@CurrentPatient() patient: PatientJwtPayload) { ... }
```

### @Roles()
Sets required roles for `RolesGuard`.
```typescript
@Post('practices')
@UseGuards(RolesGuard)
@Roles('ADMIN')
create(@Body() dto: CreatePracticeDto) { ... }
```

---

## Frontend Auth Implementation

### Doctor Dashboard (`apps/web`)

**Provider:** `apps/web/src/providers/auth-provider.tsx`
- **Dual-mode:** `LocalAuthProvider` (default) or `Auth0AuthProvider` (when `NEXT_PUBLIC_AUTH0_DOMAIN` set)
- **Storage:** `auth_token` and `auth_user` in `localStorage`
- **Context:** `useAuthContext()` → `{ user, loading, isAuthenticated, login, loginWithAuth0, logout, auth0Enabled }`

**API Client:** `apps/web/src/lib/api-client.ts`
- Axios instance with request interceptor that attaches `Authorization: Bearer <token>`
- Response interceptor: on 401, clears token and redirects to `/login`

### Patient Portal (`apps/patient`)

**Provider:** `apps/patient/src/providers/patient-auth-provider.tsx`
- **Storage:** `patient_token` and `patient_data` in `localStorage`
- **Context:** `usePatientAuth()` → `{ isAuthenticated, isLoading, patient, login, register, logout }`

**API Client:** `apps/patient/src/lib/api-client.ts`
- Same pattern as doctor app, reads `patient_token` from localStorage
- 401 redirects to `/login`

---

## Security Notes

| Aspect | Implementation |
|--------|---------------|
| Password hashing | bcryptjs, 10 salt rounds |
| JWT signing (local) | HS256 with `JWT_SECRET` |
| JWT signing (Auth0) | RS256 with JWKS public key |
| Doctor token expiry | 7 days |
| Patient token expiry | 30 days |
| Invite token | 32-byte `crypto.randomBytes` hex, 7-day expiry |
| Multi-tenant isolation | `practiceId` on every JWT + PracticeIsolationGuard |
| Patient registration | Min 8 char password, invite token required |
| Doctor registration | Min 6 char password |
