# Deployment Guide

## Build Commands

### Build All
```bash
npx pnpm build
```

This runs in order:
1. `packages/shared` → TypeScript compile to `dist/`
2. `apps/api` → NestJS compile to `dist/`
3. `apps/web` → Next.js build to `.next/`
4. `apps/patient` → Next.js build to `.next/`

### Build Individual Apps
```bash
npx pnpm --filter shared build
npx pnpm --filter api build
npx pnpm --filter web build
npx pnpm --filter patient build
```

**Important:** Always build `shared` first — other apps depend on its compiled output.

## Build Outputs

| App | Output Directory | Start Command |
|-----|-----------------|---------------|
| API | `apps/api/dist/` | `node dist/main.js` |
| Web | `apps/web/.next/` | `npx next start` |
| Patient | `apps/patient/.next/` | `npx next start -p 3002` |

---

## Production Environment Variables

### Critical (Must Set)

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/orthomonitor` | Production PostgreSQL |
| `JWT_SECRET` | (random 64+ chars) | **Change from dev default!** |
| `CORS_ORIGIN` | `https://app.orthomonitor.dev,https://patient.orthomonitor.dev` | Production domains |
| `NODE_ENV` | `production` | Enables optimizations |

### Storage (Required for file uploads in production)

| Variable | Example | Notes |
|----------|---------|-------|
| `OCI_S3_ENDPOINT` | `https://....compat.objectstorage.....com` | S3-compatible endpoint |
| `OCI_S3_REGION` | `eu-frankfurt-1` | Storage region |
| `OCI_S3_BUCKET` | `orthomonitor-scans` | Bucket name |
| `OCI_S3_ACCESS_KEY` | (access key) | |
| `OCI_S3_SECRET_KEY` | (secret key) | |

### Auth (Optional but recommended)

| Variable | Example | Notes |
|----------|---------|-------|
| `AUTH0_DOMAIN` | `orthomonitor.auth0.com` | Enables Auth0 SSO |
| `AUTH0_AUDIENCE` | `https://api.orthomonitor.dev` | API identifier |

### Push Notifications (Optional but recommended)

| Variable | Example | Notes |
|----------|---------|-------|
| `VAPID_PUBLIC_KEY` | (generated) | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | (generated) | Keep secret, do not expose to frontend |
| `VAPID_SUBJECT` | `mailto:admin@orthomonitor.dev` | Contact for push service |

### AI (Optional)

| Variable | Example | Notes |
|----------|---------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Enables AI tag suggestions |

### Frontend

| Variable | Example | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.orthomonitor.dev/api/v1` | Production API URL |
| `PATIENT_PORTAL_URL` | `https://patient.orthomonitor.dev` | For invite link generation |

---

## Start Commands (Production)

### API
```bash
cd apps/api
NODE_ENV=production node dist/main.js
```

### Web (Doctor Dashboard)
```bash
cd apps/web
NODE_ENV=production npx next start -p 3001
```

### Patient Portal
```bash
cd apps/patient
NODE_ENV=production npx next start -p 3002
```

---

## Database Migrations (Production)

```bash
# Apply pending migrations without interactive prompts
cd apps/api
npx prisma migrate deploy
```

**Do NOT use `prisma migrate dev` in production** — it may reset data. Use `migrate deploy` which only applies pending migrations.

---

## Planned Infrastructure

The project is designed for deployment on:

| Component | Target Service | Notes |
|-----------|---------------|-------|
| PostgreSQL | AWS RDS (or OCI) | Managed PostgreSQL 16 |
| Redis | AWS ElastiCache | For caching (future) |
| API | AWS ECS Fargate (or OCI Container Instances) | Containerized NestJS |
| Web | Vercel or ECS | Next.js SSR |
| Patient Portal | Vercel or ECS | Next.js SSR + PWA |
| File Storage | OCI Object Storage (S3-compatible) | Already integrated |
| Infrastructure as Code | Terraform | Not yet implemented |

---

## Docker (Production)

No production Dockerfile exists yet. A typical setup would be:

```dockerfile
# API
FROM node:18-alpine
WORKDIR /app
COPY apps/api/dist ./dist
COPY apps/api/node_modules ./node_modules
COPY apps/api/prisma ./prisma
EXPOSE 8085
CMD ["node", "dist/main.js"]
```

---

## Security Checklist

- [ ] Change `JWT_SECRET` from dev default to a strong random value (64+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to only allow production domains
- [ ] Enable HTTPS on all services
- [ ] Use managed database with encryption at rest
- [ ] Set up S3 bucket policies (private, presigned URL access only)
- [ ] Rotate `OCI_S3_ACCESS_KEY` / `OCI_S3_SECRET_KEY` regularly
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerting
- [ ] Enable rate limiting on auth endpoints
- [ ] Configure WAF/DDoS protection

---

## Stubs and TODOs

These features are planned but not yet implemented:

| Feature | Status | Notes |
|---------|--------|-------|
| Auth0 tenant configuration | Framework done | Needs real Auth0 domain, client ID, and API setup |
| Mobile app (React Native) | Not started | Planned companion app |
| Email notifications | Not started | Invite emails, scan reminders |
| SMS/WhatsApp chatbot | Not started | Via `senderType: SYSTEM` messages |
| Push notifications | **Done** | Web push via VAPID/web-push. Events: scan reviewed/flagged, doctor messages. |
| Refresh tokens | Not started | Currently single JWT per session |
| WebSocket real-time messaging | Not started | Currently polling-based |
| Terraform infrastructure | Not started | AWS/OCI IaC |
| CI/CD pipeline | Not started | GitHub Actions or similar |
| Rate limiting | Not started | Express rate-limit or NestJS throttler |
| Redis caching | Not started | Redis running but unused currently |
