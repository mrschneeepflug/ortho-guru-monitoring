# Technical Architecture

## 1. Architecture Philosophy

**Start simple.** A well-structured modular monolith on managed AWS services is faster to build, easier to debug, and cheaper to run than microservices at our initial scale. We decompose only when we hit clear scaling boundaries.

The MVP architecture is designed for HIPAA/GDPR compliance from day one.

---

## 2. Platform Components

| Component | Description | Priority |
|-----------|-------------|----------|
| Patient Mobile App (iOS/Android) | Guided intraoral photo capture, treatment timeline, secure messaging, scan reminders | MVP |
| Doctor Dashboard (Web) | Scan review interface with clinical tagging, patient management, messaging, compliance tracking | MVP |
| Clinical Tagging Engine | Structured attribute tagging system for clinical documentation and AI data collection | MVP |
| Admin & Analytics | Practice metrics, patient compliance reports, tagging analytics, billing | MVP |
| AI Analysis Engine | Automated detection models trained on crowdsourced clinical tags | Phase 2 |

---

## 3. Technology Stack

### Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Mobile App | React Native + Expo | Cross-platform (iOS + Android) from single codebase. Large ecosystem, strong camera APIs. |
| Web Dashboard | Next.js 14 (React + TypeScript) | SSR for performance, TypeScript for type safety, excellent developer experience. |
| Styling | Tailwind CSS | Rapid development, consistent design system. |

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Server | Node.js + NestJS (TypeScript) | Modular architecture maps well to our domain. TypeScript end-to-end. NestJS provides structure without overhead. |
| Database | PostgreSQL 16 (AWS RDS Multi-AZ) | Robust, HIPAA-eligible, JSONB for flexible tag storage, excellent query performance. |
| Cache | Redis (AWS ElastiCache) | Session management, rate limiting, dashboard data caching. |
| Image Storage | AWS S3 (SSE-KMS encrypted) | Scalable, encrypted at rest with customer-managed keys. |
| File Processing | AWS Lambda | Image thumbnail generation, quality preprocessing. Event-driven, cost-efficient. |

### Authentication & Security

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Auth | Auth0 | HIPAA BAA available, MFA, RBAC out of the box. Alternative: AWS Cognito (HIPAA-eligible). |
| Encryption at Rest | AES-256 (RDS, S3 SSE-KMS) | HIPAA requirement. |
| Encryption in Transit | TLS 1.3 | Certificate pinning in mobile app. |

### Notifications & Communication

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Push Notifications | Firebase Cloud Messaging | Cross-platform push. |
| SMS | Twilio | HIPAA BAA available. Scan reminders, appointment alerts. |
| Email | SendGrid | HIPAA BAA available. Transactional emails, reports. |

### Infrastructure & DevOps

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Container Hosting | AWS ECS Fargate | Serverless containers. No EC2 management. Auto-scaling. |
| CDN | AWS CloudFront | Static assets, dashboard performance. |
| IaC | Terraform | Reproducible infrastructure. Multi-environment (dev/staging/prod). |
| CI/CD | GitHub Actions | Automated testing, deployment. Integrated with GitHub repo. |
| Monitoring | DataDog or AWS CloudWatch | Application performance, error tracking, alerting. |
| Logging | AWS CloudWatch Logs | Centralized, searchable, retained for compliance (6+ years for audit logs). |

### AI/ML (Phase 2)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Primary Approach | GPT-4o / Gemini API | Foundation model approach avoids patent issues. No custom training required. |
| Fallback | PyTorch + AWS SageMaker | If custom models needed. EfficientNet backbone. |
| Image Processing | OpenCV | Quality validation, preprocessing. |
| Annotation (internal) | Label Studio | For any internal annotation quality checks. |

---

## 4. Data Flow: Scan Submission

```
Patient App                    AWS                           Doctor Dashboard
───────────                    ───                           ────────────────
1. Guided capture ──────► 2. Upload to S3 ──────────────►
   (5 photos)                  (pre-signed URL,              4. Scan appears
                               TLS 1.3)                         in feed
                                    │
                                    ▼
                          3. Lambda processes:
                             - Thumbnails
                             - EXIF extraction
                             - Quality validation
                                    │
                                    ▼                        5. Doctor reviews
                          Metadata → PostgreSQL                  & tags scan
                                                                    │
                                                                    ▼
                                                             6. Tags saved to DB
                                                                (training data)
                                                                    │
                                                                    ▼
Patient receives ◄─────────────────────────────────────── 7. Feedback sent
notification                                                 to patient
```

---

## 5. Database Schema (Core Entities)

### Practice
```
id, name, address, subscription_tier, tagging_rate,
discount_percent, settings (JSONB), created_at
```

### Doctor
```
id, practice_id (FK), name, email, role, credentials,
auth0_id, created_at
```

### Patient
```
id, practice_id (FK), doctor_id (FK), name, DOB,
treatment_type, aligner_brand, current_stage, total_stages,
scan_frequency, status, app_user_id, created_at
```

### ScanSession
```
id, patient_id (FK), submitted_at, status (pending/reviewed/flagged),
image_count, reviewed_by (FK → Doctor), reviewed_at
```

### ScanImage
```
id, session_id (FK), image_type (frontal/buccal_l/buccal_r/occlusal_u/occlusal_l),
s3_key, thumbnail_key, quality_score, created_at
```

### TagSet
```
id, session_id (FK), tagged_by (FK → Doctor), tagged_at,
overall_tracking (1-3), aligner_fit (1-3 or null),
oral_hygiene (1-3), detail_tags (JSONB), action_taken,
notes (text), ai_suggested (boolean), ai_overridden (boolean)
```

### Message
```
id, thread_id, sender_type (doctor/patient/system),
sender_id, content, attachments (JSONB), read_at, created_at
```

### AuditLog
```
id, user_id, action, resource_type, resource_id,
ip_address, timestamp
-- Immutable, append-only
```

---

## 6. API Design

RESTful API with versioning (`/api/v1/`). JWT authentication via Auth0.

| Endpoint Group | Key Routes | Auth |
|---------------|------------|------|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/mfa/verify` | Partial |
| Patients | `GET /patients`, `POST /patients`, `PATCH /patients/:id` | Doctor/Staff |
| Scans | `POST /scans/upload-url`, `POST /scans/sessions`, `GET /scans/sessions/:id` | Patient (upload), Doctor (view) |
| Tags | `POST /scans/sessions/:id/tags`, `GET /tags/analytics`, `GET /tags/export` | Doctor |
| Messages | `GET /messages/threads`, `POST /messages`, `PATCH /messages/:id/read` | Patient + Doctor |
| Dashboard | `GET /dashboard/feed`, `GET /dashboard/compliance`, `GET /dashboard/analytics` | Doctor/Staff |
| Admin | `GET /admin/practices`, `GET /admin/billing`, `GET /admin/tagging-rates` | Admin |

---

## 7. Mobile App Technical Requirements

- **Platforms:** iOS 15+, Android 10+
- **Camera:** Minimum 8MP rear camera (covers 95%+ of smartphones)
- **Offline:** Scan photos cached locally, auto-upload when reconnected
- **Authentication:** Biometric (Face ID / fingerprint) with PIN fallback
- **Languages (MVP):** English, Spanish, French, German
- **App size:** < 50MB
- **Scan session target:** < 90 seconds for 5 photos

---

## 8. Doctor Dashboard Requirements

- **Review target:** < 30 seconds per scan (with tagging)
- **Batch mode:** Swipe through patients, tag as you go
- **Keyboard shortcuts:** T=tag, A=approve, M=message, N=next
- **Photo viewer:** Full-screen, zoom, pan, side-by-side comparison with previous scans
- **Quick actions:** Approve progression, hold aligner, send message, schedule appointment

---

## 9. Infrastructure Sizing (MVP)

| Resource | Configuration | Monthly Cost (est.) |
|----------|--------------|-------------------|
| ECS Fargate (API) | 0.5 vCPU, 1GB RAM, 2 tasks | €50–100 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ, 100GB | €150–200 |
| ElastiCache Redis | cache.t3.micro | €25–50 |
| S3 | ~50GB first 6 months | €5–10 |
| Lambda | ~10K invocations/month | €5 |
| CloudFront | Low traffic initially | €10–20 |
| Auth0 | Free tier → €23/month | €0–23 |
| Twilio | ~500 SMS/month | €25–50 |
| SendGrid | Free tier initially | €0 |
| **Total** | | **€300–500/month** |

Scales linearly with usage. At 50 practices, expect €800–1,500/month.
