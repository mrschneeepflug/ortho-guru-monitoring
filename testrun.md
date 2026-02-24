# OrthoMonitor Test Suite

## Quick Start

```bash
# Run all tests
pnpm test

# Run by package
pnpm test:api      # Backend (Jest)
pnpm test:web      # Frontend (Vitest)
pnpm test:shared   # Shared types/constants (Vitest)

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
| Frontend (Next.js) | Vitest + @testing-library/react + MSW | `apps/web/vitest.config.ts` | `__tests__/*.test.ts(x)` |
| Shared | Vitest | `packages/shared/vitest.config.ts` | `__tests__/*.test.ts` |

### Backend Strategy
- **Prisma mock factory** (`apps/api/src/test/prisma-mock.factory.ts`) — creates mock PrismaService with all 9 models, each having `findMany`/`findFirst`/`findUnique`/`create`/`update`/`delete`/`count` as `jest.fn()`. `$transaction` supports both array and callback forms.
- **`jest.mock('bcrypt')`** — skips real hashing for fast auth tests.
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
| `apps/api/jest.config.js` | Jest config: ts-jest, node env, `@/*` alias, coverage patterns |
| `apps/api/src/test/prisma-mock.factory.ts` | Factory for mock PrismaService with all 9 models |
| `apps/web/vitest.config.ts` | Vitest config: jsdom, react plugin, `@` alias |
| `apps/web/src/test/setup.ts` | jest-dom matchers + cleanup |
| `apps/web/src/test/query-wrapper.tsx` | Fresh QueryClient per test (retry=false) |
| `apps/web/src/test/msw-handlers.ts` | Default MSW handlers for all API endpoints |
| `apps/web/src/test/msw-server.ts` | MSW server instance |
| `packages/shared/vitest.config.ts` | Minimal Vitest config for shared package |

## Summary

- **26 test suites** across 3 packages
- **184 passing tests** (117 backend + 56 frontend + 11 shared)
- **Unit tests only** — no E2E (those require a real database)
- **No real I/O** — all external dependencies (Prisma, APIs, localStorage) are mocked
