# OrthoMonitor - Technical Documentation

**OrthoMonitor** is a multi-tenant orthodontic treatment monitoring platform built as a monorepo with a NestJS API backend, two Next.js 14 frontends (doctor dashboard and patient portal), and a shared TypeScript package. It enables orthodontic practices to manage patients, collect dental scan photos, review treatment progress with AI-assisted tagging, and communicate with patients through a messaging system.

---

## Recommended Reading Order

### For Backend Developers
1. [Architecture Overview](./01-ARCHITECTURE-OVERVIEW.md)
2. [Getting Started](./02-GETTING-STARTED.md)
3. [Environment Configuration](./03-ENVIRONMENT-CONFIGURATION.md)
4. [Database Schema](./04-DATABASE-SCHEMA.md)
5. [Authentication System](./05-AUTHENTICATION-SYSTEM.md)
6. [Backend API Reference](./06-BACKEND-API-REFERENCE.md)
7. [Backend Modules Deep Dive](./07-BACKEND-MODULES-DEEPDIVE.md)
8. [Common Module](./08-COMMON-MODULE.md)
9. [Storage System](./09-STORAGE-SYSTEM.md)
10. [AI Tagging System](./10-AI-TAGGING-SYSTEM.md)
11. [Testing Guide](./14-TESTING-GUIDE.md)

### For Frontend Developers
1. [Architecture Overview](./01-ARCHITECTURE-OVERVIEW.md)
2. [Getting Started](./02-GETTING-STARTED.md)
3. [Shared Package](./13-SHARED-PACKAGE.md)
4. [Doctor Dashboard](./11-DOCTOR-DASHBOARD.md)
5. [Patient Portal](./12-PATIENT-PORTAL.md)
6. [Data Flows](./15-DATA-FLOWS.md)
7. [Testing Guide](./14-TESTING-GUIDE.md)

### For a New AI Agent
1. [Table of Contents](./00-TABLE-OF-CONTENTS.md) (this file)
2. [Architecture Overview](./01-ARCHITECTURE-OVERVIEW.md)
3. [Database Schema](./04-DATABASE-SCHEMA.md)
4. [Authentication System](./05-AUTHENTICATION-SYSTEM.md)
5. [Backend API Reference](./06-BACKEND-API-REFERENCE.md)
6. [Common Module](./08-COMMON-MODULE.md)
7. [Data Flows](./15-DATA-FLOWS.md)
8. Then read remaining docs as needed for the specific task.

---

## Documentation Index

| # | File | Title | Description |
|---|------|-------|-------------|
| 00 | [00-TABLE-OF-CONTENTS.md](./00-TABLE-OF-CONTENTS.md) | Table of Contents | Master index, reading orders, codebase stats |
| 01 | [01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md) | Architecture Overview | System design, tech stack, request pipeline, multi-tenancy |
| 02 | [02-GETTING-STARTED.md](./02-GETTING-STARTED.md) | Getting Started | Dev setup, prerequisites, running locally |
| 03 | [03-ENVIRONMENT-CONFIGURATION.md](./03-ENVIRONMENT-CONFIGURATION.md) | Environment Configuration | Every env var, Docker, config files |
| 04 | [04-DATABASE-SCHEMA.md](./04-DATABASE-SCHEMA.md) | Database Schema | All models, fields, enums, relationships |
| 05 | [05-AUTHENTICATION-SYSTEM.md](./05-AUTHENTICATION-SYSTEM.md) | Authentication System | Doctor auth, patient auth, JWT, Auth0, guards |
| 06 | [06-BACKEND-API-REFERENCE.md](./06-BACKEND-API-REFERENCE.md) | Backend API Reference | Every endpoint with request/response shapes |
| 07 | [07-BACKEND-MODULES-DEEPDIVE.md](./07-BACKEND-MODULES-DEEPDIVE.md) | Backend Modules Deep Dive | Each module's services, controllers, design |
| 08 | [08-COMMON-MODULE.md](./08-COMMON-MODULE.md) | Common Module | Guards, interceptors, filters, decorators, Prisma |
| 09 | [09-STORAGE-SYSTEM.md](./09-STORAGE-SYSTEM.md) | Storage System | OCI S3, local fallback, upload flows, thumbnails |
| 10 | [10-AI-TAGGING-SYSTEM.md](./10-AI-TAGGING-SYSTEM.md) | AI Tagging System | Claude vision, tag taxonomy, discount tiers |
| 11 | [11-DOCTOR-DASHBOARD.md](./11-DOCTOR-DASHBOARD.md) | Doctor Dashboard | apps/web pages, components, hooks, auth |
| 12 | [12-PATIENT-PORTAL.md](./12-PATIENT-PORTAL.md) | Patient Portal | apps/patient pages, scan wizard, messaging |
| 13 | [13-SHARED-PACKAGE.md](./13-SHARED-PACKAGE.md) | Shared Package | Types, constants, tag definitions |
| 14 | [14-TESTING-GUIDE.md](./14-TESTING-GUIDE.md) | Testing Guide | Test stack, patterns, mocking, coverage |
| 15 | [15-DATA-FLOWS.md](./15-DATA-FLOWS.md) | Data Flows | End-to-end flows: invite, scan, review, messaging |
| 16 | [16-DEPLOYMENT-GUIDE.md](./16-DEPLOYMENT-GUIDE.md) | Deployment Guide | Build, production config, planned infrastructure |

---

## Existing Research Documents

- [`research/`](./research/) - Business strategy and market research documents
- [`OrthoMonitor_v2_Manual_First_Spec.docx`](./OrthoMonitor_v2_Manual_First_Spec.docx) - Product specification document

---

## Codebase Statistics

| Metric | Count |
|--------|-------|
| Total source files (`.ts` / `.tsx`) | ~229 |
| Backend modules | 11 (auth, patient-auth, practices, patients, scans, tagging, messaging, dashboard, patient-portal, notifications, common) |
| API endpoints | 45+ |
| Database models | 11 (Practice, Doctor, Patient, PatientInvite, ScanSession, ScanImage, TagSet, MessageThread, Message, AuditLog, PushSubscription) |
| Test files | 28 |
| Test cases | ~165 |
| Frontend apps | 2 (Doctor Dashboard on port 3001, Patient Portal on port 3002) |
| Shared packages | 1 (packages/shared) |
