# Environment Configuration

All environment variables are configured in `apps/api/.env`. Copy from `.env.example` to get started.

## Complete Variable Reference

### Core (Required)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `DATABASE_URL` | `postgresql://ortho:ortho_secret@localhost:5432/orthomonitor?schema=public` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | `dev-jwt-secret-change-in-production` | Secret for signing HS256 JWT tokens |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3002` | Comma-separated allowed origins |

### Auth0 (Optional — enables dual-mode authentication)

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH0_DOMAIN` | — | Auth0 tenant domain (e.g., `your-tenant.auth0.com`). When set, enables Auth0 RS256 validation. |
| `AUTH0_AUDIENCE` | — | Auth0 API audience identifier |
| `AUTH0_DEFAULT_PRACTICE_ID` | — | Default practice ID for Auth0-created doctors |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | — | Auth0 domain for frontend SDK |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | — | Auth0 client ID for frontend SDK |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | — | Auth0 audience for frontend SDK |

When `AUTH0_DOMAIN` is set, the JWT strategy uses JWKS to validate RS256 tokens from Auth0 in addition to local HS256 tokens.

### OCI Object Storage (Optional — enables cloud file storage)

| Variable | Default | Description |
|----------|---------|-------------|
| `OCI_S3_ENDPOINT` | — | S3-compatible endpoint URL |
| `OCI_S3_REGION` | `eu-frankfurt-1` | Storage region |
| `OCI_S3_BUCKET` | `orthomonitor-scans` | Bucket name |
| `OCI_S3_ACCESS_KEY` | — | S3 access key |
| `OCI_S3_SECRET_KEY` | — | S3 secret key |

When `OCI_S3_ENDPOINT` + access/secret keys are set, uploads go to cloud storage with presigned URLs. Otherwise, the system falls back to local filesystem storage in `uploads/`.

### AI Suggestions (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Anthropic API key for Claude vision analysis |

When set, enables the "Get AI Suggestion" feature in the tagging panel. Uses `claude-sonnet-4-20250514`.

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` | API base URL for frontend apps |
| `PATIENT_PORTAL_URL` | `http://localhost:3002` | Base URL for patient invite links |

## Full `.env.example`

```env
# Server
PORT=3001
CORS_ORIGIN="http://localhost:3000,http://localhost:3002"

# Database
DATABASE_URL="postgresql://ortho:ortho_secret@localhost:5432/orthomonitor?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="dev-jwt-secret-change-in-production"

# Auth0 (optional — uncomment to enable)
# AUTH0_DOMAIN="your-tenant.auth0.com"
# AUTH0_AUDIENCE="https://api.orthomonitor.dev"
# AUTH0_DEFAULT_PRACTICE_ID=""
# NEXT_PUBLIC_AUTH0_DOMAIN="your-tenant.auth0.com"
# NEXT_PUBLIC_AUTH0_CLIENT_ID="your-client-id"
# NEXT_PUBLIC_AUTH0_AUDIENCE="https://api.orthomonitor.dev"

# OCI Object Storage (optional — uncomment to enable cloud storage)
# OCI_S3_ENDPOINT="https://frl2s5ay1y6t.compat.objectstorage.eu-frankfurt-1.oraclecloud.com"
# OCI_S3_REGION="eu-frankfurt-1"
# OCI_S3_BUCKET="orthomonitor-scans"
# OCI_S3_ACCESS_KEY="your-access-key"
# OCI_S3_SECRET_KEY="your-secret-key"

# AI Suggestions (optional)
# ANTHROPIC_API_KEY="sk-ant-..."

# Patient Portal
PATIENT_PORTAL_URL="http://localhost:3002"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

## Docker Compose Configuration

File: `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ortho-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ortho
      POSTGRES_PASSWORD: ortho_secret
      POSTGRES_DB: orthomonitor
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ortho"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ortho-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Feature Flags (Env-Based)

The system uses optional environment variables as implicit feature flags:

| Feature | Enabled When |
|---------|-------------|
| Auth0 SSO | `AUTH0_DOMAIN` is set |
| Cloud file storage | `OCI_S3_ENDPOINT` + access keys are set |
| AI tag suggestions | `ANTHROPIC_API_KEY` is set |

When these variables are absent, the system gracefully degrades: local auth only, local filesystem storage, and the AI suggest button is hidden/disabled.
