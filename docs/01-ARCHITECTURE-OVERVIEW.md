# Architecture Overview

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Doctor Dashboard│     │  Patient Portal  │
│  (Next.js 14)   │     │  (Next.js 14)    │
│  Port 3000      │     │  Port 3002       │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         │    HTTP / REST API    │
         └──────────┬────────────┘
                    │
         ┌──────────▼──────────┐
         │    NestJS API        │
         │    Port 3001         │
         │    /api/v1/...       │
         │    Swagger: /api/docs│
         └──┬────┬────┬────┬───┘
            │    │    │    │
   ┌────────▼┐ ┌▼────▼┐ ┌▼────────┐
   │PostgreSQL│ │Redis │ │OCI S3   │
   │Port 5432 │ │:6379 │ │(Storage)│
   └──────────┘ └──────┘ └─────────┘
                            │
                   ┌────────▼────────┐
                   │  Anthropic API   │
                   │  (Claude Vision) │
                   └─────────────────┘
```

## Monorepo Structure

```
ortho-guru-monitoring/
├── apps/
│   ├── api/           # NestJS backend (Port 3001)
│   ├── web/           # Doctor dashboard - Next.js 14 (Port 3000)
│   └── patient/       # Patient portal - Next.js 14 PWA (Port 3002)
├── packages/
│   └── shared/        # Shared TypeScript types & constants
├── docker-compose.yml # PostgreSQL 16 + Redis 7
├── pnpm-workspace.yaml
├── package.json       # Root workspace scripts
└── docs/              # This documentation
```

**Workspace manager:** pnpm (use `npx pnpm` if pnpm is not on PATH)

**Dependency graph:**
- `apps/api` depends on `packages/shared`
- `apps/web` depends on `packages/shared`
- `apps/patient` depends on `packages/shared`

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **API** | NestJS | 10.x |
| **API Runtime** | Node.js | >= 18 |
| **API Language** | TypeScript | 5.x |
| **ORM** | Prisma | 5.x |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Auth** | Passport JWT + bcryptjs | HS256 local / RS256 Auth0 |
| **Storage** | AWS SDK v3 (S3-compatible) | OCI Object Storage |
| **Image Processing** | Sharp | 0.34.x |
| **AI** | Anthropic SDK | Claude Sonnet 4 |
| **Doctor Frontend** | Next.js 14 (App Router) | 14.1.x |
| **Patient Frontend** | Next.js 14 (App Router, PWA) | 14.1.x |
| **UI Components** | shadcn/ui + Tailwind CSS | 3.x |
| **Data Fetching** | TanStack React Query | 5.x |
| **HTTP Client** | Axios | 1.x |
| **Icons** | lucide-react | - |
| **Date Formatting** | date-fns | - |
| **API Docs** | Swagger (via @nestjs/swagger) | - |
| **Backend Testing** | Jest + ts-jest | 29.x |
| **Frontend Testing** | Vitest + React Testing Library | 1.x |

## Port Assignments

| Service | Port | URL |
|---------|------|-----|
| Doctor Dashboard (web) | 3000 | `http://localhost:3000` |
| NestJS API | 3001 | `http://localhost:3001/api/v1` |
| Patient Portal | 3002 | `http://localhost:3002` |
| PostgreSQL | 5432 | `postgresql://ortho:ortho_secret@localhost:5432/orthomonitor` |
| Redis | 6379 | `redis://localhost:6379` |
| Swagger Docs | 3001 | `http://localhost:3001/api/docs` |

## Multi-Tenancy Model

All data is scoped by `practiceId`. Every core entity (Patient, Doctor, ScanSession, MessageThread, AuditLog) belongs to a Practice.

- **JWT tokens** carry `practiceId` as a claim
- **PracticeIsolationGuard** (global) validates URL `practiceId` params match the user's practice
- **All services** accept `practiceId` as a parameter and scope their database queries

## Global Request Pipeline

Every request passes through this pipeline in order:

```
Request
  │
  ▼
┌─────────────────────┐
│ 1. JwtAuthGuard     │  Validates JWT token (skips @Public routes)
│    (APP_GUARD)       │  Populates request.user with decoded payload
└──────────┬──────────┘
           ▼
┌─────────────────────────────┐
│ 2. PracticeIsolationGuard   │  Injects request.practiceId from JWT
│    (APP_GUARD)               │  Blocks cross-tenant access
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 3. ValidationPipe (global)   │  Validates DTOs (whitelist, transform)
└──────────┬──────────────────┘
           ▼
┌──────────────────────────┐
│ 4. Controller Handler     │  Route handler executes
└──────────┬───────────────┘
           ▼
┌──────────────────────────────┐
│ 5. TransformInterceptor      │  Wraps response in { data, meta? }
│    (APP_INTERCEPTOR)          │
└──────────┬───────────────────┘
           ▼
┌──────────────────────────────┐
│ 6. AuditLogInterceptor       │  Logs POST/PUT/PATCH/DELETE to DB
│    (APP_INTERCEPTOR)          │  (non-blocking, non-fatal)
└──────────┬───────────────────┘
           ▼
       Response

(On exception):
┌──────────────────────────────┐
│ PrismaExceptionFilter        │  P2002→409, P2025→404, P2003→400
│ HttpExceptionFilter          │  Standardizes error response format
│ (APP_FILTER)                  │
└──────────────────────────────┘
```

## API Configuration

- **Global prefix:** `/api/v1`
- **Swagger:** Available at `/api/docs` (OpenAPI 3.0)
- **Validation:** Global `ValidationPipe` with `whitelist: true` and `transform: true`
- **CORS:** Configurable via `CORS_ORIGIN` env var (default: `http://localhost:3000,http://localhost:3002`)

## Response Format

All successful responses are wrapped by `TransformInterceptor`:

```json
{
  "data": { ... },
  "meta": { ... }
}
```

Error responses follow a consistent format:

```json
{
  "statusCode": 404,
  "message": "Record not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
