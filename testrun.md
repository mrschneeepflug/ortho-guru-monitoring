# OrthoMonitor Test Suite

## Quick Start

```bash
# Run all unit tests
pnpm test

# Run by package
pnpm test:api      # Backend unit tests (Jest)
pnpm test:web      # Frontend (Vitest)
pnpm test:shared   # Shared types/constants (Vitest)

# E2E integration tests (requires Docker PostgreSQL)
pnpm test:e2e

# Run a specific E2E suite
pnpm --filter api test:e2e -- --testPathPattern=auth

# Watch mode
pnpm --filter api test:watch
pnpm --filter web test:watch

# Coverage
pnpm test:coverage
```

## Architecture

| Layer | Framework | Config | Test pattern |
|-------|-----------|--------|--------------|
| Backend (NestJS) | Jest + ts-jest + @nestjs/testing | `apps/api/jest.config.js` | `*.spec.ts` (co-located) |
| Backend E2E | Jest + ts-jest + supertest + real PostgreSQL | `apps/api/jest-e2e.config.js` | `test/*.e2e-spec.ts` |
| Frontend (Next.js) | Vitest + @testing-library/react + MSW | `apps/web/vitest.config.ts` | `__tests__/*.test.ts(x)` |
| Shared | Vitest | `packages/shared/vitest.config.ts` | `__tests__/*.test.ts` |

### Backend Strategy
- **Prisma mock factory** (`apps/api/src/test/prisma-mock.factory.ts`) — creates mock PrismaService with all 9 models, each having `findMany`/`findFirst`/`findUnique`/`create`/`update`/`delete`/`count` as `jest.fn()`. `$transaction` supports both array and callback forms.
- **`jest.mock('bcryptjs')`** — skips real hashing for fast unit tests.
- **`jest.useFakeTimers()`** — freezes time for date-dependent compliance tests.
- No real database required — all tests are isolated unit tests.

### Frontend Strategy
- **MSW (Mock Service Worker)** — intercepts at network level for realistic API mocking.
  - Default handlers: `apps/web/src/test/msw-handlers.ts`
  - Server instance: `apps/web/src/test/msw-server.ts`
- **Query wrapper** (`apps/web/src/test/query-wrapper.tsx`) — fresh `QueryClient` per test with `retry: false, gcTime: 0`.
- **jsdom** environment for component testing.
- **jest-dom** matchers for DOM assertions.

## Test File Inventory

### Backend — 16 test suites (117 tests)

#### Critical (Guards, Auth, Core Business Logic)
| File | Tests | What it covers |
|------|-------|----------------|
| `tagging/tagging-analytics.service.spec.ts` | 8 | `calculateDiscountTier` boundary cases (0%, 49.99%, 50%, 69%, 70%, 84%, 85%, 100%), `getTaggingRate`, `getAnalytics` |
| `dashboard/dashboard.service.spec.ts` | 10 | Compliance % (on-time/overdue/mixed/no-patients), feed merge+sort, tagging rate, summary |
| `auth/auth.service.spec.ts` | 7 | Register (hash+JWT), login (verify), invalid creds, ConflictException, generateToken |
| `common/guards/jwt-auth.guard.spec.ts` | 3 | @Public bypass, delegates to super, metadata check |
| `common/guards/roles.guard.spec.ts` | 5 | No roles→allow, null user→deny, role match/mismatch |
| `common/guards/practice-isolation.guard.spec.ts` | 6 | Injects practiceId, cross-tenant ForbiddenException, unauthenticated pass-through |

#### High (Service CRUD, Practice Isolation)
| File | Tests | What it covers |
|------|-------|----------------|
| `patients/patients.service.spec.ts` | 10 | Pagination, filters (status/doctorId/search), practice isolation, date parsing, CRUD |
| `scans/scans.service.spec.ts` | 8 | Create session, status transitions (REVIEWED sets reviewedAt), practice scope |
| `tagging/tagging.service.spec.ts` | 7 | Tag creation+transaction, findBySession, practice isolation, default values |
| `messaging/messaging.service.spec.ts` | 10 | Thread CRUD, sendMessage, markAsRead, unread count, cross-practice denial |

#### Medium (Infrastructure, Support Services)
| File | Tests | What it covers |
|------|-------|----------------|
| `practices/practices.service.spec.ts` | 6 | ADMIN sees all, non-ADMIN sees own, CRUD, cross-practice ForbiddenException |
| `scans/upload.service.spec.ts` | 3 | Upload URL generation, NotFoundException, practice scope validation |
| `common/interceptors/transform.interceptor.spec.ts` | 5 | Wraps in {data}, pass-through when already wrapped, arrays, null, strings |
| `common/interceptors/audit-log.interceptor.spec.ts` | 5 | Skips GET, skips no-user, creates log for POST/DELETE, swallows errors |
| `common/filters/prisma-exception.filter.spec.ts` | 5 | P2002→409, P2025→404, P2003→400, unknown→500, timestamp |
| `common/filters/http-exception.filter.spec.ts` | 5 | String and object responses, timestamp, 401, 403 |

### Frontend — 9 test suites (56 tests)

#### Utilities & Auth
| File | Tests | What it covers |
|------|-------|----------------|
| `lib/__tests__/utils.test.ts` | 10 | `cn()` merge/conditional/tailwind, `formatDate()`, `formatDateTime()`, `formatRelativeTime()` |
| `lib/__tests__/auth.test.ts` | 10 | login→stores token, logout→clears+redirects, getToken, getUser, isAuthenticated |

#### React Query Hooks (MSW-backed)
| File | Tests | What it covers |
|------|-------|----------------|
| `lib/hooks/__tests__/use-patients.test.ts` | 6 | CRUD hooks, cache invalidation on create/update, conditional enable |
| `lib/hooks/__tests__/use-scans.test.ts` | 5 | Session hooks, conditional enables, cache invalidation |
| `lib/hooks/__tests__/use-tagging.test.ts` | 4 | Dual invalidation (tags+scans on submit), conditional enable |
| `lib/hooks/__tests__/use-dashboard.test.ts` | 3 | Summary, feed, compliance data fetching |
| `lib/hooks/__tests__/use-messages.test.ts` | 4 | Threads, send message, cache invalidation, conditional enable |

#### Components
| File | Tests | What it covers |
|------|-------|----------------|
| `components/patients/__tests__/patient-form.test.tsx` | 6 | Empty→undefined coercion, parseInt, submit callback, loading state |
| `components/patients/__tests__/patient-table.test.tsx` | 8 | Pagination calc, button disable states, loading skeleton, null handling |

### Backend E2E — 9 test suites (72 tests)

Tests hit the real NestJS app via supertest with a real PostgreSQL database (`orthomonitor_test`).

| File | Tests | What it covers |
|------|-------|----------------|
| `test/auth.e2e-spec.ts` | 10 | Register (success, duplicate 409, missing fields, invalid email, short password), login (success, wrong password, unknown email), auth guard (no token 401, valid token 200) |
| `test/patients.e2e-spec.ts` | 12 | CRUD, pagination, status filter, case-insensitive search, 404 on nonexistent, missing fields 400, practice isolation |
| `test/scans.e2e-spec.ts` | 10 | Create session (PENDING status), patient-not-in-practice 404, missing patientId 400, list/filter/detail, REVIEWED sets reviewedAt, FLAGGED does NOT set reviewedAt |
| `test/tagging.e2e-spec.ts` | 8 | Create tag set (session becomes REVIEWED), cross-practice 403, nonexistent 404, get tags, cross-practice tags 404, analytics (rate + discount), zero-state analytics |
| `test/messaging.e2e-spec.ts` | 10 | Create thread, patient-not-in-practice 404, list threads (lastMessage + unreadCount), thread detail with messages, send message, thread-not-in-practice 404, mark as read, cross-practice 404 |
| `test/dashboard.e2e-spec.ts` | 8 | Summary (pendingScans, totalPatients, compliancePercentage, taggingRate), values reflect DB state, feed sorted desc, feed includes all 3 types, compliance stats, overdue patients with daysSinceLastScan |
| `test/practices.e2e-spec.ts` | 6 | ADMIN sees all, DOCTOR sees own, get practice details, cross-practice 403, update own, cross-practice update 403 |
| `test/multi-tenancy.e2e-spec.ts` | 7 | Practice isolation: each practice sees only its own patients, cross-practice patient access 404, cross-practice patient update 404, cross-practice scan 404, cross-practice thread 404, cross-practice scan creation 404 |
| `test/validation.e2e-spec.ts` | 6 | Reject unknown fields (forbidNonWhitelisted), wrong types 400, empty body 400, out-of-range values 400, error response shape (statusCode + message + timestamp), duplicate email 409 |

#### E2E Test Infrastructure

| File | Purpose |
|------|---------|
| `apps/api/jest-e2e.config.js` | Separate Jest config: `test/` root, `*.e2e-spec.ts` pattern, 30s timeout, global setup/teardown |
| `apps/api/test/setup.ts` | Global setup: creates `orthomonitor_test` DB via Docker, pushes Prisma schema, seeds baseline (1 practice + 2 doctors) |
| `apps/api/test/teardown.ts` | Global teardown: drops `orthomonitor_test` database |
| `apps/api/test/app.factory.ts` | Creates real NestJS test app with all modules, same config as `main.ts` (prefix, validation pipe) |
| `apps/api/test/helpers.ts` | `loginAs(app, email)` → JWT token; `resetDb(prisma)` → truncates all tables except baseline; `BASELINE` constants |

#### E2E Prerequisites

- **Docker** running with PostgreSQL container (`docker-compose up -d postgres`)
- Tests create and drop `orthomonitor_test` database automatically
- No manual DB setup needed — the global setup handles everything

### Shared — 1 test suite (11 tests)

| File | Tests | What it covers |
|------|-------|----------------|
| `packages/shared/src/__tests__/tags.test.ts` | 11 | DISCOUNT_TIERS full coverage/no gaps/ascending, TAG_SCORES, DETAIL_TAG_OPTIONS uniqueness, IMAGE_TYPES labels |

## Coverage Targets

| Area | Target | Key files |
|------|--------|-----------|
| Services | 80%+ | All `*.service.ts` files |
| Guards | 90%+ | `jwt-auth.guard.ts`, `roles.guard.ts`, `practice-isolation.guard.ts` |
| Filters | 90%+ | `prisma-exception.filter.ts`, `http-exception.filter.ts` |
| Interceptors | 85%+ | `transform.interceptor.ts`, `audit-log.interceptor.ts` |
| Frontend utils | 90%+ | `utils.ts`, `auth.ts` |
| Frontend hooks | 70%+ | All `use-*.ts` hook files |

## Test Infrastructure Files

| File | Purpose |
|------|---------|
| `apps/api/jest.config.js` | Unit test Jest config: ts-jest, node env, `@/*` alias, coverage patterns |
| `apps/api/jest-e2e.config.js` | E2E Jest config: real DB, global setup/teardown, 30s timeout |
| `apps/api/test/setup.ts` | E2E global setup: create DB, push schema, seed baseline |
| `apps/api/test/teardown.ts` | E2E global teardown: drop test database |
| `apps/api/test/app.factory.ts` | E2E app factory: creates real NestJS app for supertest |
| `apps/api/test/helpers.ts` | E2E helpers: `loginAs()`, `resetDb()`, baseline constants |
| `apps/api/src/test/prisma-mock.factory.ts` | Factory for mock PrismaService with all 9 models |
| `apps/web/vitest.config.ts` | Vitest config: jsdom, react plugin, `@` alias |
| `apps/web/src/test/setup.ts` | jest-dom matchers + cleanup |
| `apps/web/src/test/query-wrapper.tsx` | Fresh QueryClient per test (retry=false) |
| `apps/web/src/test/msw-handlers.ts` | Default MSW handlers for all API endpoints |
| `apps/web/src/test/msw-server.ts` | MSW server instance |
| `packages/shared/vitest.config.ts` | Minimal Vitest config for shared package |

## Summary

- **35 test suites** across 3 packages
- **256 passing tests** (117 backend unit + 72 backend E2E + 56 frontend + 11 shared)
- **Unit tests** — fast, no real I/O, all external dependencies mocked
- **E2E tests** — full request→database→response chain with real PostgreSQL, verifies validation pipes, guard ordering, interceptor wrapping, Prisma query correctness, and multi-tenant isolation
