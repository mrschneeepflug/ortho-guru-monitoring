# OrthoMonitor

**Manual-First Remote Orthodontic Monitoring Platform**

Affordable. Practical. AI-Ready.

---

## What is OrthoMonitor?

OrthoMonitor is a remote orthodontic monitoring platform that lets patients scan their teeth at home and doctors review scans on a dashboard — at a fraction of the cost of existing solutions like DentalMonitoring.

**Strategy:** Launch as a manual review tool (v1.0), collect expert-labeled training data through a crowdsourced tagging system, then activate AI-assisted features (v2.0) once sufficient data exists.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Spec (docx)](./docs/OrthoMonitor_v2_Manual_First_Spec.docx) | Full technical specification & architecture |
| [Competitive Analysis](./docs/research/01-competitive-analysis.md) | DentalMonitoring research, pricing intel, market positioning |
| [Technical Architecture](./docs/research/02-technical-architecture.md) | Stack decisions, infrastructure, database design |
| [Crowdsourced Tagging Model](./docs/research/03-crowdsourced-tagging-model.md) | The core innovation — clinical tagging as AI training data |
| [Patent Research](./docs/research/04-patent-research.md) | DM's patent portfolio, risk assessment, design-around strategies |
| [AI Roadmap & Design-Around](./docs/research/05-ai-roadmap-design-around.md) | Phase 2 AI strategy, foundation model approach, patent avoidance |
| [Go-To-Market Strategy](./docs/research/06-go-to-market-strategy.md) | Pricing, target market, launch plan |
| [Regulatory & Compliance](./docs/research/07-regulatory-compliance.md) | HIPAA, GDPR, FDA/SaMD pathway |
| [Risks & Mitigations](./docs/research/08-risks-mitigations.md) | Key risks ranked by impact with mitigation strategies |
| [Test Suite](./testrun.md) | Test pipeline docs: commands, architecture, file inventory, coverage targets |

## Key Numbers

| Metric | Value |
|--------|-------|
| MVP Budget (6 months) | €150K–250K |
| Time to Internal Pilot | 4 months |
| Time to First Paying Customers | 6 months |
| Starter Tier Price | €99/month |
| DentalMonitoring Entry Cost | €62,500+ upfront |
| Our Price Advantage | ~90% cheaper |

## Tech Stack

### Current (Dev Scaffold)

- **Web Dashboard:** Next.js 14 (TypeScript, Tailwind, TanStack Query)
- **Patient Portal:** Next.js 14 PWA (mobile-first, guided scan uploads, messaging)
- **API:** Node.js + NestJS (Swagger auto-docs)
- **Database:** PostgreSQL 16 (Docker) + Prisma ORM
- **Cache:** Redis 7 (Docker)
- **Auth (Doctor):** Dual-mode JWT — local bcrypt+HS256 (default) with optional Auth0 RS256 via JWKS
- **Auth (Patient):** Invite-based registration + email/password login, 30-day JWT tokens
- **Storage:** OCI Object Storage (S3-compatible) with local filesystem fallback
- **AI:** Claude vision API for tag suggestions (optional, set `ANTHROPIC_API_KEY`)
- **Monorepo:** pnpm workspaces
- **Testing:** Jest + @nestjs/testing (API), Vitest + Testing Library + MSW (Web)

### Planned (Production)

- **Mobile:** React Native + Expo (hybrid SMS/WhatsApp chatbot layer)
- **Database:** AWS RDS (PostgreSQL 16)
- **Storage:** AWS S3 (encrypted)
- **Auth:** Auth0 tenant credentials (framework ready, plug in Auth0 domain/clientId)
- **Infrastructure:** AWS ECS Fargate, Terraform

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start database services
docker compose up -d

# 3. Copy environment config
cp .env.example .env

# 4. Run database migrations and seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Start dev servers (API :8085, Web :3001, Patient :3002)
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + Web + Patient in parallel |
| `pnpm dev:api` | Start API only (port 8085) |
| `pnpm dev:web` | Start Doctor Dashboard only (port 3001) |
| `pnpm dev:patient` | Start Patient Portal only (port 3002) |
| `pnpm build` | Build all packages |
| `pnpm build:api` | Build API |
| `pnpm build:web` | Build Doctor Dashboard |
| `pnpm build:patient` | Build Patient Portal |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm test` | Run all tests (API + Web + Shared) |
| `pnpm test:api` | Run backend tests (Jest) |
| `pnpm test:web` | Run frontend tests (Vitest) |
| `pnpm test:shared` | Run shared package tests (Vitest) |
| `pnpm test:coverage` | Run all tests with coverage |

### Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin (Doctor) | admin@orthomonitor.dev | password123 |
| Doctor | doctor@orthomonitor.dev | password123 |
| Patient | alice@example.com | patient123 |

### Project Structure

```
ortho-guru-monitoring/
├── apps/
│   ├── api/            # NestJS backend (port 8085)
│   │   ├── prisma/     #   Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/           # Doctor auth (local + Auth0)
│   │       ├── common/         # Guards, decorators, interceptors, Prisma, storage
│   │       ├── dashboard/      # Dashboard analytics
│   │       ├── messaging/      # Doctor-patient messaging
│   │       ├── patient-auth/   # Patient invite, register, login
│   │       ├── patient-portal/ # Patient API (profile, scans, messages)
│   │       ├── patients/       # Patient CRUD + invite endpoint
│   │       ├── practices/      # Practice management
│   │       ├── scans/          # Scan sessions, uploads, images
│   │       └── tagging/        # Clinical tagging + AI suggestions
│   ├── patient/        # Next.js Patient Portal PWA (port 3002)
│   │   └── src/
│   │       ├── app/            # Pages (home, scan, messages, login, register)
│   │       ├── components/     # UI, layout, scan wizard, messages
│   │       ├── lib/            # API client, hooks, types, utils
│   │       └── providers/      # Auth + React Query providers
│   └── web/            # Next.js Doctor Dashboard (port 3001)
│       └── src/
│           ├── app/            # Pages (dashboard, patients, scans, messages, settings)
│           ├── components/     # UI, layout, scan viewer, tagging panel
│           ├── lib/            # API client, hooks, types, utils
│           └── providers/      # Auth + React Query providers
├── packages/
│   └── shared/         # Shared TS types & tag constants
└── docs/               # Research & specifications
```

### API Documentation

Swagger UI available at `http://localhost:8085/api/docs` when the API is running.

### Key API Endpoints

**Doctor Auth** (`/api/v1/auth/`)
- `POST /login` — Doctor login
- `POST /register` — Doctor registration

**Patient Auth** (`/api/v1/patient-auth/`)
- `POST /register` — Accept invite + create account
- `POST /login` — Patient login
- `GET /me` — Current patient profile
- `GET /validate-invite/:token` — Check invite validity

**Patient Portal** (`/api/v1/patient/`)
- `GET /profile` — Treatment progress + doctor name
- `GET /scans` — Own scan sessions
- `POST /scans/sessions` — Create scan session
- `POST /scans/upload-url` — Presigned upload URL
- `POST /scans/upload/confirm` — Confirm direct upload
- `GET /messages` — Thread list with unread counts
- `GET /messages/:threadId` — Thread conversation
- `POST /messages` — Send message

**Doctor Portal** (`/api/v1/`)
- `POST /patients/:id/invite` — Generate patient portal invite

### Patient Portal Flow

1. Doctor opens patient detail page and clicks "Invite to Portal"
2. System generates a 7-day invite link (e.g., `http://localhost:3002/register/{token}`)
3. Doctor shares link with patient (text, email, in person)
4. Patient opens link, sets email + password to create account
5. Patient logs into portal: sees treatment progress, takes guided scan photos, messages doctor

### Auth0 SSO (Optional)

Auth0 integration is built in but disabled by default. To enable, add these to your `.env`:

```env
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://api.orthomonitor.dev"
AUTH0_DEFAULT_PRACTICE_ID=""              # optional, auto-creates "Default Practice" if unset
NEXT_PUBLIC_AUTH0_DOMAIN="your-tenant.auth0.com"
NEXT_PUBLIC_AUTH0_CLIENT_ID="your-client-id"
NEXT_PUBLIC_AUTH0_AUDIENCE="https://api.orthomonitor.dev"
```

When enabled:
- Login page shows a "Sign in with Auth0" button alongside the existing email/password form
- Auth0 users are auto-created as Doctor records on first login (linked by email or Auth0 sub)
- Local email/password login continues to work in parallel

### OCI Object Storage (Optional)

Cloud storage is built in but falls back to local filesystem by default. To enable OCI:

```env
OCI_S3_ENDPOINT="https://your-namespace.compat.objectstorage.region.oraclecloud.com"
OCI_S3_REGION="eu-frankfurt-1"
OCI_S3_BUCKET="orthomonitor-scans"
OCI_S3_ACCESS_KEY="your-access-key"
OCI_S3_SECRET_KEY="your-secret-key"
```

## Status

- Backend API with 10 modules (auth, patient-auth, patient-portal, patients, practices, scans, tagging, messaging, dashboard, common)
- Doctor Dashboard (Next.js PWA) with full patient management, scan review, tagging, messaging, analytics
- Patient Portal (Next.js PWA) with invite auth, guided 5-photo scan wizard, messaging
- 125 passing backend unit tests, 56 frontend unit tests, 11 shared tests
