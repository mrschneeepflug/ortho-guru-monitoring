# Backend Modules Deep Dive

## Module Dependency Graph

```
AppModule
├── EventEmitterModule.forRoot()
├── CommonModule (global guards, interceptors, filters)
│   └── PrismaModule (global)
├── StorageModule (global)
├── AiModule (global)
├── NotificationsModule (global — push service + event listeners)
├── RefreshTokenModule (global — Redis + refresh token service)
├── AuthModule
│   ├── PassportModule
│   └── JwtModule (15-min access)
├── PracticesModule
├── PatientsModule
│   └── PatientAuthModule
├── PatientAuthModule
│   └── JwtModule (1-hour access)
├── PatientPortalModule
├── ScansModule
├── TaggingModule
├── MessagingModule
└── DashboardModule
```

Global modules (PrismaModule, StorageModule, AiModule, NotificationsModule, RefreshTokenModule) are available everywhere without explicit imports.

---

## Auth Module

**Path:** `apps/api/src/auth/`
**Files:** `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `strategies/jwt.strategy.ts`, `dto/`

### Purpose
Handles doctor authentication: login, registration, JWT generation, and Auth0 integration.

### Service Methods

| Method | Description |
|--------|-------------|
| `register(dto, meta?)` | Create doctor with bcrypt-hashed password, return JWT + refresh token |
| `login(dto, meta?)` | Validate credentials, return JWT + refresh token |
| `refreshAccessToken(rawToken, meta?)` | Rotate refresh token, return new JWT + refresh token |
| `logout(rawToken)` | Revoke refresh token family |
| `getMe(doctorId)` | Fetch doctor profile by ID |
| `findOrCreateAuth0User(auth0Sub, email, name)` | Create/link doctor for Auth0 SSO |
| `generateToken(doctor)` | Sign JWT with `{ sub, email, role, practiceId, type: 'doctor' }` |

### Design Decisions
- **Dual-mode JWT strategy** uses `secretOrKeyProvider` to dynamically select HS256 or RS256 based on token header `kid` field
- Auth0 users get auto-provisioned as doctors with a default practice ID
- Password stored as `passwordHash` (nullable — Auth0-only users have no local password)

---

## Patient Auth Module

**Path:** `apps/api/src/patient-auth/`
**Files:** `patient-auth.module.ts`, `patient-auth.controller.ts`, `patient-auth.service.ts`, `dto/`

### Purpose
Handles patient invite generation, registration, login, and refresh/logout with 1-hour access tokens and 30-day refresh tokens.

### Service Methods

| Method | Description |
|--------|-------------|
| `createInvite(patientId, email, practiceId)` | Generate 7-day invite token (32-byte hex) |
| `validateInvite(token)` | Check validity, expiry, and used status |
| `register(token, email, password, meta?)` | Validate invite, hash password, update patient, mark invite used (transaction), return JWT + refresh token |
| `login(email, password, meta?)` | Authenticate patient, return JWT + refresh token |
| `refreshAccessToken(rawToken, meta?)` | Rotate refresh token, return new JWT + refresh token |
| `logout(rawToken)` | Revoke refresh token family |
| `getProfile(patientId)` | Get patient with doctor name |

### Design Decisions
- Separate JwtModule with 1-hour access token expiry (vs 15-min for doctors)
- Invite-based registration: patients can only register with a valid invite from their doctor
- Uses `crypto.randomBytes(32).toString('hex')` for invite tokens
- Registration is transactional: patient update + invite marking happen atomically

---

## Patients Module

**Path:** `apps/api/src/patients/`
**Files:** `patients.module.ts`, `patients.controller.ts`, `patients.service.ts`, `dto/`

### Purpose
CRUD operations for patients. Doctor-facing endpoints.

### Service Methods

| Method | Description |
|--------|-------------|
| `findAll(practiceId, query)` | Paginated list with status, doctorId, search filters |
| `findOne(id, practiceId)` | Get patient with practice isolation check |
| `create(dto, practiceId)` | Create patient in practice |
| `update(id, dto, practiceId)` | Update patient fields |

### Design Decisions
- Imports `PatientAuthModule` to delegate invite creation to `PatientAuthService`
- Search filter uses Prisma `contains` on patient name (case-insensitive)
- The invite endpoint lives on this controller (`POST /patients/:id/invite`) but delegates to `PatientAuthService.createInvite()`

---

## Patient Portal Module

**Path:** `apps/api/src/patient-portal/`
**Files:** `patient-portal.module.ts`, `patient-portal.controller.ts`, `patient-scans.controller.ts`, `patient-messages.controller.ts`, `patient-push.controller.ts`, `patient-portal.service.ts`

### Purpose
Patient-facing API endpoints: profile, scan uploads, messaging, and push notification subscription. All guarded by `PatientAuthGuard` (except public VAPID key endpoint).

### Controllers
- **PatientPortalController** (`/patient/profile`) — profile with lastScanDate and nextScanDue
- **PatientScansController** (`/patient/scans`) — list scans, create sessions, upload, confirm, get URLs
- **PatientMessagesController** (`/patient/messages`) — threads, messages, send, mark read
- **PatientPushController** (`/patient/push`) — VAPID public key (public), subscribe, unsubscribe

### Service Methods

| Category | Method | Description |
|----------|--------|-------------|
| Profile | `getProfile(patientId)` | Patient profile + lastScanDate + nextScanDue + practiceSettings (messagingMode, whatsappNumber) |
| Scans | `listScans(patientId)` | Patient's scan sessions |
| Scans | `createScanSession(patientId)` | New PENDING session |
| Scans | `generateUploadUrl(patientId, sessionId, imageType)` | Presigned PUT URL |
| Scans | `confirmUpload(patientId, sessionId, imageType, key)` | Create ScanImage + thumbnail |
| Scans | `handleLocalUpload(patientId, sessionId, imageType, file)` | Multipart fallback |
| Scans | `getImageUrl(patientId, imageId)` | Presigned GET URL |
| Messages | `listThreads(patientId)` | Threads with unread counts (non-patient messages) |
| Messages | `getThread(patientId, threadId)` | Thread with messages |
| Messages | `sendMessage(patientId, threadId, content)` | Send as PATIENT |
| Messages | `markMessageRead(patientId, messageId)` | Set readAt |

### Design Decisions
- `verifySessionOwnership()` private method ensures patients can only access their own scan sessions
- Unread count filters by `senderType !== 'PATIENT'` (patient only sees doctor/system messages as unread)
- `nextScanDue` = lastScanDate + scanFrequency days
- `getProfile` joins the patient's practice to include `practiceSettings` (messaging mode and WhatsApp number) in the response

---

## Scans Module

**Path:** `apps/api/src/scans/`
**Files:** `scans.module.ts`, `scans.controller.ts`, `scans.service.ts`, `upload.controller.ts`, `upload.service.ts`, `thumbnail.service.ts`, `dto/`

### Purpose
Scan session management, image upload/download, and thumbnail generation.

### Controllers
- **ScansController** (`/scans/sessions`) — CRUD for scan sessions
- **UploadController** (`/scans`) — presigned URLs, upload confirmation, multipart upload, image/thumbnail download

### Service Methods

**ScansService:**

| Method | Description |
|--------|-------------|
| `createSession(patientId, practiceId)` | Create PENDING session |
| `findAll(practiceId, query)` | Paginated list with status/patient filters |
| `findOne(id, practiceId)` | Session with images and tagSet |
| `updateStatus(id, status, reviewedById, practiceId)` | Update status, set reviewedAt/By if REVIEWED, emit `scan.reviewed` or `scan.flagged` event |

**UploadService:**

| Method | Description |
|--------|-------------|
| `generateUploadUrl(sessionId, imageType, practiceId)` | Build S3 key + presigned PUT URL (15 min) |
| `confirmUpload(sessionId, imageType, key, practiceId)` | Create ScanImage record + generate thumbnail |
| `handleLocalUpload(sessionId, imageType, file, practiceId)` | Save to `uploads/` directory |
| `getImageUrl(imageId, practiceId)` | Presigned GET URL (cloud) or local file URL |
| `getThumbnailUrl(imageId, practiceId)` | Presigned GET for thumbnail |

**ThumbnailService:**

| Method | Description |
|--------|-------------|
| `generateThumbnail(buffer)` | Sharp: 300x300 max, WebP quality 75 |
| `buildThumbnailKey(key)` | Append `-thumb.webp` to original key |
| `generateAndStoreCloud(originalKey)` | Download from S3, generate, upload thumbnail |
| `generateAndStoreFromBuffer(buffer, s3Key, localPath)` | Generate + store (cloud or local) |

### Design Decisions
- Upload is a 2-step flow: get presigned URL → PUT from browser → confirm to API
- Thumbnails are generated on confirm (non-fatal on error)
- Local multipart upload is a fallback when cloud storage is not configured
- `imageCount` on ScanSession is incremented on each confirmed upload

---

## Tagging Module

**Path:** `apps/api/src/tagging/`
**Files:** `tagging.module.ts`, `tagging.controller.ts`, `tagging.service.ts`, `tagging-analytics.service.ts`, `dto/`

### Purpose
Scan tagging (doctor reviews), AI-assisted suggestions, and practice analytics/discount tiers.

### Service Methods

**TaggingService:**

| Method | Description |
|--------|-------------|
| `createTagSet(sessionId, dto, taggedById, practiceId)` | Create TagSet + mark session REVIEWED (transaction) |
| `findBySession(sessionId, practiceId)` | Get TagSet with isolation check |
| `findByDoctor(doctorId, practiceId)` | Doctor's tag submissions |
| `suggestTags(sessionId, practiceId)` | Load images → send to AiService → return suggestions |

**TaggingAnalyticsService:**

| Method | Description |
|--------|-------------|
| `getTaggingRate(practiceId)` | (tagged sessions / total sessions) * 100 for last 30 days |
| `calculateDiscountTier(rate)` | Rate → discount: 85%+ → 30%, 70-84% → 20%, 50-69% → 10%, <50% → 0% |
| `getAnalytics(practiceId)` | Full analytics + persist to practice record |

### Design Decisions
- Creating a TagSet atomically marks the session as REVIEWED
- AI suggestions validate against `DETAIL_TAG_OPTIONS` constant (shared package)
- Numeric scores are clamped to 1-3 range
- Analytics are persisted to the Practice model for display on settings page

---

## Messaging Module

**Path:** `apps/api/src/messaging/`
**Files:** `messaging.module.ts`, `messaging.controller.ts`, `messaging.service.ts`, `dto/`

### Purpose
Doctor-patient messaging with threads, messages, and unread tracking.

### Service Methods

| Method | Description |
|--------|-------------|
| `createThread(dto, practiceId)` | Create thread after verifying patient is in practice |
| `findAllThreads(practiceId)` | Threads with unreadCount and lastMessage |
| `findThread(threadId, practiceId)` | Thread with all messages ordered asc |
| `sendMessage(dto, userId, userRole, practiceId)` | Create message with auto-detected senderType, emit `message.sent` event for doctor/system messages |
| `markAsRead(messageId, userId, practiceId)` | Set readAt timestamp |

### Design Decisions
- `senderType` is auto-determined from the JWT role if not explicitly provided
- Unread count is calculated as count of messages where `readAt IS NULL` in a given thread
- Threads are sorted by `updatedAt DESC` (most recent activity first)

---

## Notifications Module

**Path:** `apps/api/src/notifications/`
**Files:** `notifications.module.ts`, `notifications.service.ts`, `notifications.listener.ts`, `events.ts`, `dto/subscribe-push.dto.ts`

### Purpose
Global module for web push notifications. Listens to domain events emitted by other modules and sends push notifications to subscribed patients.

### Event Flow

```
ScansService / MessagingService
  │  emit('scan.reviewed' | 'scan.flagged' | 'message.sent')
  ▼
NotificationsListener (@OnEvent handlers)
  │  Builds notification payload (title, body, url, tag)
  ▼
NotificationsService.sendToPatient(patientId, payload)
  │  Loads PushSubscription records for patient
  │  Sends via web-push library
  ▼
Browser Push Service → Service Worker → showNotification()
```

### Events

| Event | Emitted By | Trigger |
|-------|-----------|---------|
| `scan.reviewed` | `ScansService.updateStatus()` | Status changed to REVIEWED |
| `scan.flagged` | `ScansService.updateStatus()` | Status changed to FLAGGED |
| `message.sent` | `MessagingService.sendMessage()` | Doctor or system sends a message |

### Service Methods

| Method | Description |
|--------|-------------|
| `onModuleInit()` | Reads VAPID env vars, calls `webPush.setVapidDetails()`. Logs warning if not configured. |
| `getVapidPublicKey()` | Returns the VAPID public key (or null) |
| `subscribe(patientId, subscription, userAgent?)` | Upserts `PushSubscription` by endpoint |
| `unsubscribe(patientId, endpoint)` | Deletes matching subscription |
| `sendToPatient(patientId, payload)` | Finds all subscriptions, sends via `webPush.sendNotification()`. Auto-deletes stale subscriptions on 410/404. |

### Design Decisions
- `@Global()` module so `NotificationsService` is injectable everywhere without explicit imports
- Uses `@nestjs/event-emitter` for decoupled event handling — zero changes to existing service method signatures
- Graceful degradation: no VAPID keys → logs warning, all sends are no-ops
- Stale subscription cleanup: expired push endpoints (410/404) are automatically deleted
- `message.sent` only fires for DOCTOR/SYSTEM sender types (not PATIENT — patients don't need to be notified of their own messages)
- Message preview is truncated to 100 characters

---

## Dashboard Module

**Path:** `apps/api/src/dashboard/`
**Files:** `dashboard.module.ts`, `dashboard.controller.ts`, `dashboard.service.ts`

### Purpose
Aggregated metrics and activity feed for the doctor dashboard home page.

### Service Methods

| Method | Description |
|--------|-------------|
| `getSummary(practiceId)` | Combines pending scans count, total patients, compliance %, tagging rate |
| `getFeed(practiceId)` | Merges recent scans (20), messages (10), tags (10) into sorted feed |
| `getComplianceStats(practiceId)` | On-time vs overdue patients based on scanFrequency |
| `getTaggingRate(practiceId)` | 30-day tagged/total percentage |

### Design Decisions
- Feed is a unified view of 3 different entity types, merged and sorted by date
- Compliance calculation: compares each active patient's last scan date against their `scanFrequency` (default 14 days)
- Overdue patients include `daysSinceLastScan` for display

---

## Practices Module

**Path:** `apps/api/src/practices/`
**Files:** `practices.module.ts`, `practices.controller.ts`, `practices.service.ts`, `dto/`

### Purpose
Practice (tenant) management. CRUD operations with role-based access.

### Service Methods

| Method | Description |
|--------|-------------|
| `findAll(user)` | All practices if ADMIN, else only user's practice |
| `findOne(id, practiceId)` | Single practice with isolation check |
| `create(dto)` | Create new practice (ADMIN only) |
| `update(id, dto, practiceId)` | Update practice fields |
| `updateSettings(id, practiceId, dto)` | Merge messaging settings into `settings` JSON field (ADMIN only) |
| `getSettings(id)` | Parse and return `{ messagingMode, whatsappNumber? }` from `settings` JSON |

### Design Decisions
- Create and updateSettings are restricted to `@Roles('ADMIN')` via RolesGuard
- `findAll` uses the JWT payload to scope results (ADMINs see all, others see only their own)
- `updateSettings` merges into the existing `settings` JSON field, preserving any other keys. When switching to portal mode, `whatsappNumber` is cleared
