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

## Key Numbers

| Metric | Value |
|--------|-------|
| MVP Budget (6 months) | €150K–250K |
| Time to Internal Pilot | 4 months |
| Time to First Paying Customers | 6 months |
| Starter Tier Price | €99/month |
| DentalMonitoring Entry Cost | €62,500+ upfront |
| Our Price Advantage | ~90% cheaper |

## Tech Stack (MVP)

- **Mobile:** React Native + Expo
- **Web Dashboard:** Next.js 14 (TypeScript)
- **API:** Node.js + NestJS
- **Database:** PostgreSQL 16 (AWS RDS)
- **Storage:** AWS S3 (encrypted)
- **Auth:** Auth0 (HIPAA BAA)
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

# 5. Start dev servers (API on :3001, Web on :3000)
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + Web in parallel |
| `pnpm dev:api` | Start API only |
| `pnpm dev:web` | Start Web only |
| `pnpm build` | Build all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio |

### Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@orthomonitor.dev | password123 |
| Doctor | doctor@orthomonitor.dev | password123 |

### Project Structure

```
ortho-guru-monitoring/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js dashboard (port 3000)
├── packages/
│   └── shared/       # Shared TS types & constants
└── docs/             # Research & specifications
```

### API Documentation

Swagger UI available at `http://localhost:3001/api/docs` when the API is running.

## Status

🟢 Scaffold complete — Backend API + Web Dashboard skeleton ready for feature development.
