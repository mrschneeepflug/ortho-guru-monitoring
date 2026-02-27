# Getting Started

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | >= 18 | Required for all apps |
| pnpm | >= 8 | Use `npx pnpm` if not on PATH |
| Docker & Docker Compose | Latest | For PostgreSQL + Redis |
| Git | Latest | Version control |

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repo-url> ortho-guru-monitoring
cd ortho-guru-monitoring
```

### 2. Install Dependencies

```bash
npx pnpm install
```

### 3. Start Docker Services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432 (user: `ortho`, password: `ortho_secret`, db: `orthomonitor`)
- **Redis 7** on port 6379

### 4. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
```

The defaults in `.env.example` are configured for local development and should work without modification.

### 5. Database Setup

```bash
# Generate Prisma client (stop API dev server first if running — DLL lock on Windows)
npx pnpm --filter api run db:generate

# Run migrations
npx pnpm --filter api run db:migrate

# Seed sample data
npx pnpm --filter api run db:seed
```

**Important (Windows):** `prisma generate` fails if the API dev server is running due to a DLL lock. Stop the dev server first.

### 6. Build Shared Package

```bash
npx pnpm --filter shared build
```

### 7. Start Development Servers

```bash
# Start all 3 apps in parallel
npx pnpm dev

# Or start individually:
npx pnpm dev:api      # API on port 8085
npx pnpm dev:web      # Doctor Dashboard on port 3001
npx pnpm dev:patient  # Patient Portal on port 3002
```

## Verifying the Setup

### Swagger UI
Open `http://localhost:8085/api/docs` — you should see the full API documentation.

### Doctor Login
1. Open `http://localhost:3001`
2. Login with: `admin@orthomonitor.dev` / `password123`
3. You should see the dashboard with sample data.

### Patient Login
1. Open `http://localhost:3002`
2. Login with: `alice@example.com` / `patient123`
3. You should see the patient home with treatment progress.

## Seeded Data Inventory

| Entity | Details |
|--------|---------|
| **Practice** | 1 — "Smile Orthodontics" (ID: `seed-practice-001`, tier: professional) |
| **Doctors** | 2 — Dr. Sarah Chen (ADMIN, admin@orthomonitor.dev), Dr. James Wilson (DOCTOR, doctor@orthomonitor.dev) |
| **Patients** | 5 — Alice Johnson (ACTIVE, Invisalign 8/22), Bob Martinez (ACTIVE, Braces 3/18), Carol Nguyen (PAUSED, ClearCorrect 15/30), David Kim (ACTIVE, Braces 10/24), Emily Torres (PAUSED, Invisalign 1/20) |
| **Patient with Portal Access** | Alice Johnson — alice@example.com / patient123 |
| **Scan Sessions** | 3 — 1 PENDING, 1 REVIEWED (with tags), 1 FLAGGED |
| **Message Threads** | 1 — with 2 messages (doctor + patient) |

## Available Scripts

All scripts are run from the repository root using `npx pnpm <script>`.

| Script | Description |
|--------|-------------|
| `dev` | Start all 3 apps in parallel |
| `dev:api` | Start API server only |
| `dev:web` | Start doctor dashboard only |
| `dev:patient` | Start patient portal only |
| `build` | Build shared package, then all apps |
| `test` | Run all tests across all packages |
| `test:api` | Run backend tests (Jest) |
| `test:shared` | Run shared package tests (Vitest) |
| `test:coverage` | Run tests with coverage reports |

### API-Specific Scripts (run with `npx pnpm --filter api run <script>`)

| Script | Description |
|--------|-------------|
| `db:generate` | Generate Prisma client |
| `db:migrate` | Run database migrations |
| `db:seed` | Seed sample data |
| `dev` | Start in watch mode |
| `build` | Compile TypeScript |
| `start:prod` | Start compiled build |
| `test` | Run unit tests |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests with coverage |

## Troubleshooting

### `prisma generate` fails on Windows
**Cause:** The NestJS dev server holds a DLL lock on the Prisma client.
**Fix:** Stop the API dev server (`Ctrl+C`), then run `db:generate`.

### `pnpm` not found
**Fix:** Use `npx pnpm` instead of `pnpm` directly.

### Docker containers won't start
**Fix:** Ensure Docker Desktop is running. Check ports 5432 and 6379 aren't in use.

### Database connection refused
**Fix:** Wait for PostgreSQL healthcheck to pass: `docker compose ps` should show "healthy".

### Frontend shows "Network Error"
**Fix:** Ensure the API server is running on port 8085. Both frontends proxy API requests via Next.js rewrites.
