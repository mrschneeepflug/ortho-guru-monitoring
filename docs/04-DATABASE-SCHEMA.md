# Database Schema

**ORM:** Prisma 5.x
**Database:** PostgreSQL 16
**Schema file:** `apps/api/prisma/schema.prisma`

## Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│   Practice   │────<│    Doctor     │────<│    TagSet      │
│              │     │              │     │               │
│              │────<│              │────<│ ScanSession    │
└──────┬───────┘     └──────────────┘     │  (reviewedBy)  │
       │                                   └───────┬───────┘
       │             ┌──────────────┐              │
       └────────────<│   Patient    │──────────────┤
                     │              │              │
                     └──┬───┬───┬──┬─┘   ┌────────▼───────┐
                        │   │   │  │     │  ScanSession    │
               ┌────────┘   │   │  └──┐  └──┬─────────────┘
               │            │   │     │     │
    ┌──────────▼──┐  ┌──────▼───▼──┐  │  ┌──▼──────────┐
    │PatientInvite│  │MessageThread │  │  │  ScanImage   │
    └─────────────┘  └──────┬──────┘  │  └─────────────┘
                            │         │
    ┌────────────────┐ ┌────▼──────┐  │  ┌─────────────┐
    │PushSubscription│ │  Message   │  └─>│  TagSet      │
    └────────────────┘ └───────────┘     └─────────────┘

                     ┌──────────────┐
                     │  AuditLog    │──> Practice (optional)
                     └──────────────┘
```

## Enums

### DoctorRole
| Value | Description |
|-------|-------------|
| `ADMIN` | Full access, can manage practices |
| `DOCTOR` | Standard doctor access |
| `HYGIENIST` | Limited access role |

### PatientStatus
| Value | Description |
|-------|-------------|
| `ACTIVE` | Currently in treatment |
| `PAUSED` | Treatment temporarily paused |
| `COMPLETED` | Treatment finished |
| `DROPPED` | Patient left treatment |

### ScanStatus
| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting doctor review |
| `REVIEWED` | Doctor has reviewed and tagged |
| `FLAGGED` | Requires attention |

### ImageType
| Value | Description |
|-------|-------------|
| `FRONT` | Front-facing dental photo |
| `LEFT` | Left side photo |
| `RIGHT` | Right side photo |
| `UPPER_OCCLUSAL` | Upper jaw occlusal view |
| `LOWER_OCCLUSAL` | Lower jaw occlusal view |

### SenderType
| Value | Description |
|-------|-------------|
| `DOCTOR` | Message from a doctor |
| `PATIENT` | Message from a patient |
| `SYSTEM` | Automated system message |

---

## Models

### Practice

The tenant model. All data is scoped to a practice.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `name` | String | | Practice name |
| `address` | String? | | Physical address |
| `phone` | String? | | Phone number |
| `subscriptionTier` | String | @default("free") | Subscription level |
| `taggingRate` | Float | @default(0) | Calculated tagging percentage |
| `discountPercent` | Float | @default(0) | Current discount tier |
| `settings` | Json | @default({}) | Flexible settings (see [Practice Settings Schema](#practice-settings-schema)) |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** doctors[], patients[], auditLogs[]
**Table:** `practices`

#### Practice Settings Schema

The `settings` JSON field stores practice-level configuration. Current keys:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `messagingMode` | `'portal' \| 'whatsapp'` | `'portal'` | Patient messaging channel. Portal = in-app messaging; WhatsApp = external link |
| `whatsappNumber` | `string?` | — | Office WhatsApp number (digits only, e.g. `"1234567890"`). Required when `messagingMode` is `'whatsapp'`, cleared when switched to portal |

Updated via `PATCH /practices/:id/settings` (ADMIN only). Read by the patient portal's `GET /patient/profile` endpoint to determine which messaging UI to show.

---

### Doctor

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `practiceId` | String | FK → Practice | Tenant scope |
| `name` | String | | Full name |
| `email` | String | @unique | Login email |
| `role` | DoctorRole | @default(DOCTOR) | Access role |
| `credentials` | String? | | Professional credentials |
| `passwordHash` | String? | | bcrypt hash (null for Auth0-only) |
| `auth0Id` | String? | @unique | Auth0 subject ID |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** practice, patients[], reviewedScans[] (ScanSession), tagSets[]
**Indexes:** `practiceId`
**Table:** `doctors`

---

### Patient

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `practiceId` | String | FK → Practice | Tenant scope |
| `doctorId` | String | FK → Doctor | Assigned doctor |
| `name` | String | | Full name |
| `email` | String? | @unique | Login email (set on portal registration) |
| `passwordHash` | String? | | bcrypt hash (set on portal registration) |
| `dateOfBirth` | DateTime? | | Date of birth |
| `treatmentType` | String? | | e.g., "Invisalign", "Braces" |
| `alignerBrand` | String? | | Aligner manufacturer |
| `currentStage` | Int | @default(1) | Current treatment stage |
| `totalStages` | Int? | | Total planned stages |
| `scanFrequency` | Int | @default(14) | Expected days between scans |
| `status` | PatientStatus | @default(ACTIVE) | Treatment status |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** practice, doctor, scanSessions[], messageThreads[], invites[], pushSubscriptions[]
**Indexes:** `practiceId`, `doctorId`
**Table:** `patients`

---

### PatientInvite

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `patientId` | String | FK → Patient | Which patient |
| `token` | String | @unique | 32-byte hex invite token |
| `email` | String? | | Pre-filled email |
| `expiresAt` | DateTime | | 7-day expiry |
| `usedAt` | DateTime? | | Null until registration |
| `createdAt` | DateTime | @default(now()) | |

**Relations:** patient
**Indexes:** `token`
**Table:** `patient_invites`

---

### ScanSession

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `patientId` | String | FK → Patient | Which patient |
| `status` | ScanStatus | @default(PENDING) | Review status |
| `imageCount` | Int | @default(0) | Number of images |
| `reviewedById` | String? | FK → Doctor | Who reviewed |
| `reviewedAt` | DateTime? | | When reviewed |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** patient, reviewedBy (Doctor), images[] (ScanImage), tagSet? (TagSet)
**Indexes:** `patientId`, `status`
**Table:** `scan_sessions`

---

### ScanImage

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `sessionId` | String | FK → ScanSession | Parent session |
| `imageType` | ImageType | | Which angle |
| `s3Key` | String? | | Cloud storage key |
| `thumbnailKey` | String? | | Cloud thumbnail key |
| `localPath` | String? | | Local filesystem path |
| `qualityScore` | Float? | | Optional quality metric |
| `createdAt` | DateTime | @default(now()) | |

**Relations:** session (onDelete: Cascade)
**Indexes:** `sessionId`
**Table:** `scan_images`

---

### TagSet

One-to-one with ScanSession. Created when a doctor reviews a scan.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `sessionId` | String | @unique, FK → ScanSession | One tag set per session |
| `taggedById` | String | FK → Doctor | Who tagged |
| `overallTracking` | Int | | 1 (Good), 2 (Fair), 3 (Poor) |
| `alignerFit` | Int? | | 1-3 (optional for non-aligner) |
| `oralHygiene` | Int | | 1 (Good), 2 (Fair), 3 (Poor) |
| `detailTags` | Json | @default([]) | Array of detail tag strings |
| `actionTaken` | String? | | Action description |
| `notes` | String? | | Free-text clinical notes |
| `aiSuggested` | Boolean | @default(false) | Whether AI was used |
| `aiOverridden` | Boolean | @default(false) | Whether doctor changed AI values |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** session (ScanSession), taggedBy (Doctor)
**Indexes:** `taggedById`
**Table:** `tag_sets`

---

### MessageThread

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `patientId` | String | FK → Patient | Thread patient |
| `subject` | String | | Thread subject line |
| `isActive` | Boolean | @default(true) | Can be closed |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** patient, messages[]
**Indexes:** `patientId`
**Table:** `message_threads`

---

### Message

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `threadId` | String | FK → MessageThread | Parent thread |
| `senderType` | SenderType | | Who sent it |
| `senderId` | String | | Doctor ID or Patient ID |
| `content` | String | | Message body |
| `attachments` | Json | @default([]) | File attachment metadata |
| `readAt` | DateTime? | | Null until read |
| `createdAt` | DateTime | @default(now()) | |

**Relations:** thread (MessageThread)
**Indexes:** `threadId`
**Table:** `messages`

---

### AuditLog

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `userId` | String | | Who performed action |
| `userRole` | String | | ADMIN, DOCTOR, PATIENT |
| `action` | String | | e.g., "POST /auth/login" |
| `resourceType` | String | | e.g., "patients", "scans" |
| `resourceId` | String? | | Affected resource ID |
| `practiceId` | String? | FK → Practice | Tenant scope |
| `ipAddress` | String? | | Client IP |
| `metadata` | Json | | Duration, status code, etc. |
| `timestamp` | DateTime | @default(now()) | |

**Relations:** practice? (Practice)
**Indexes:** `practiceId`, `userId`, `timestamp`
**Table:** `audit_logs`

---

### PushSubscription

Stores web push subscription endpoints for patient notifications.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `patientId` | String | FK → Patient | Which patient |
| `endpoint` | String | @unique | Push service endpoint URL |
| `p256dh` | String | | Client public key |
| `auth` | String | | Client auth secret |
| `userAgent` | String? | | Browser user agent |
| `createdAt` | DateTime | @default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

**Relations:** patient (onDelete: Cascade)
**Indexes:** `patientId`
**Table:** `push_subscriptions`

---

## Migration Management

Migrations are stored in `apps/api/prisma/migrations/`.

```bash
# Create a new migration
npx pnpm --filter api run db:migrate

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (destructive)
npx prisma migrate reset
```

## Seed Data

The seed script (`apps/api/prisma/seed.ts`) creates the sample data described in [Getting Started](./02-GETTING-STARTED.md#seeded-data-inventory). It uses `upsert` operations so it can be run multiple times safely.
