# Backend API Reference

**Base URL:** `http://localhost:8085/api/v1`
**Swagger:** `http://localhost:8085/api/docs`

## Global Conventions

### Authentication
All endpoints require `Authorization: Bearer <token>` unless marked `@Public`.

**Refresh tokens** are sent as httpOnly cookies (`ortho_refresh` for doctors, `patient_refresh` for patients) — path-scoped to their respective auth endpoints. Clients must use `withCredentials: true` (or `credentials: 'include'`).

### Response Wrapper
All successful responses are wrapped:
```json
{
  "data": { ... },
  "meta": { ... }
}
```

### Error Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Pagination
Paginated endpoints accept `?page=1&limit=20` query params and return:
```json
{
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Validation
Request bodies are validated with `class-validator`. Invalid fields return 400 with details.

---

## Auth Module

### `POST /auth/login` `@Public`
Login as a doctor.

**Body:**
```json
{ "email": "string (IsEmail)", "password": "string (min 6)" }
```
**Response:** `{ accessToken: string, user: { id, email, name, role, practiceId } }`
**Errors:** 401 (invalid credentials)

### `POST /auth/register` `@Public`
Register a new doctor.

**Body:**
```json
{ "name": "string", "email": "string (IsEmail)", "password": "string (min 6)", "practiceId": "string" }
```
**Response:** `{ accessToken: string, user: { id, email, name, role, practiceId } }`
**Errors:** 409 (email exists)

### `POST /auth/refresh` `@Public`
Refresh access token using the `ortho_refresh` httpOnly cookie.

**Cookie:** `ortho_refresh` (set automatically on login/register)
**Response:** `{ accessToken: string }`
**Side effect:** Sets new `ortho_refresh` cookie (rotate-on-use)
**Errors:** 401 (no cookie, invalid/expired token, or token reuse detected)

### `POST /auth/logout` `@Public`
Revoke the refresh token family and clear the cookie.

**Cookie:** `ortho_refresh`
**Response:** `{ message: "Logged out" }`
**Side effect:** Clears `ortho_refresh` cookie, revokes all tokens in the family

### `GET /auth/me`
Get current doctor profile.

**Auth:** Doctor JWT
**Response:** `{ id, email, name, role, practiceId, auth0Id, createdAt, updatedAt }`

---

## Patient Auth Module

### `POST /patient-auth/register` `@Public`
Register a patient using an invite token.

**Body:**
```json
{ "token": "string", "email": "string (IsEmail)", "password": "string (min 8)" }
```
**Response:** `{ accessToken: string, patient: PatientProfile }`
**Errors:** 400 (invalid/expired token), 409 (email exists)

### `POST /patient-auth/login` `@Public`
Login as a patient.

**Body:**
```json
{ "email": "string (IsEmail)", "password": "string" }
```
**Response:** `{ accessToken: string, patient: PatientProfile }`
**Errors:** 401 (invalid credentials)

### `GET /patient-auth/me`
Get current patient profile.

**Auth:** Patient JWT (PatientAuthGuard)
**Response:** `PatientProfile { id, name, email, practiceId, treatmentType, alignerBrand, currentStage, totalStages, scanFrequency, status }`

### `POST /patient-auth/refresh` `@Public`
Refresh patient access token using the `patient_refresh` httpOnly cookie.

**Cookie:** `patient_refresh` (set automatically on login/register)
**Response:** `{ accessToken: string }`
**Side effect:** Sets new `patient_refresh` cookie (rotate-on-use)
**Errors:** 401 (no cookie, invalid/expired token, or token reuse detected)

### `POST /patient-auth/logout` `@Public`
Revoke the patient refresh token family and clear the cookie.

**Cookie:** `patient_refresh`
**Response:** `{ message: "Logged out" }`
**Side effect:** Clears `patient_refresh` cookie, revokes all tokens in the family

### `GET /patient-auth/validate-invite/:token` `@Public`
Validate an invite token.

**Params:** `token` (string)
**Response:** `{ valid: boolean, patientName: string, email: string | null }`

---

## Practices Module

### `GET /practices`
List practices. Admins see all; others see only their own.

**Auth:** Doctor JWT
**Response:** `Practice[]`

### `GET /practices/:id`
Get a single practice.

**Auth:** Doctor JWT
**Response:** `Practice`
**Errors:** 404, 403 (cross-tenant)

### `POST /practices`
Create a practice. Admin only.

**Auth:** Doctor JWT + `@Roles('ADMIN')`
**Body:**
```json
{ "name": "string", "address?": "string", "phone?": "string", "subscriptionTier?": "string" }
```
**Response:** `Practice`

### `PATCH /practices/:id`
Update a practice.

**Auth:** Doctor JWT
**Body:** Partial practice fields
**Response:** `Practice`
**Errors:** 403 (cross-tenant)

### `PATCH /practices/:id/settings`
Update practice settings (messaging mode, etc.).

**Auth:** Doctor JWT + `@Roles('ADMIN')`
**Body:**
```json
{ "messagingMode": "portal | whatsapp", "whatsappNumber?": "string (digits, required when whatsapp)" }
```
**Response:** `Practice` (with updated `settings` JSON)
**Errors:** 403 (cross-tenant or non-admin), 404

---

## Patients Module

### `GET /patients`
List patients with pagination and filters.

**Auth:** Doctor JWT
**Query:** `?page=1&limit=20&status=ACTIVE&doctorId=xxx&search=name`
**Response:** `{ items: Patient[], total, page, limit }`

### `GET /patients/:id`
Get a single patient.

**Auth:** Doctor JWT
**Response:** `Patient` (with doctor relation)
**Errors:** 404

### `POST /patients`
Create a patient.

**Auth:** Doctor JWT
**Body:**
```json
{
  "name": "string",
  "doctorId?": "string",
  "dateOfBirth?": "ISO date",
  "treatmentType?": "string",
  "alignerBrand?": "string",
  "currentStage?": "number",
  "totalStages?": "number",
  "scanFrequency?": "number"
}
```
**Response:** `Patient`

### `PATCH /patients/:id`
Update a patient.

**Auth:** Doctor JWT
**Body:** Partial patient fields
**Response:** `Patient`

### `POST /patients/:id/invite`
Generate a patient portal invite.

**Auth:** Doctor JWT
**Body:**
```json
{ "email?": "string (IsEmail)" }
```
**Response:** `{ token: string, inviteUrl: string, expiresAt: DateTime }`

---

## Scans Module

### `POST /scans/sessions`
Create a new scan session.

**Auth:** Doctor JWT
**Body:**
```json
{ "patientId": "string" }
```
**Response:** `ScanSession`

### `GET /scans/sessions`
List scan sessions with filters.

**Auth:** Doctor JWT
**Query:** `?page=1&limit=20&status=PENDING&patientId=xxx`
**Response:** `{ items: ScanSession[], total, page, limit }`

### `GET /scans/sessions/:id`
Get a scan session with images and tag set.

**Auth:** Doctor JWT
**Response:** `ScanSession` (includes `images[]` and `tagSet`)

### `PATCH /scans/sessions/:id/status`
Update scan session status.

**Auth:** Doctor JWT
**Body:**
```json
{ "status": "PENDING | REVIEWED | FLAGGED" }
```
**Response:** `ScanSession`

### `POST /scans/upload/upload-url`
Get a presigned upload URL for direct-to-storage upload.

**Auth:** Doctor JWT
**Body:**
```json
{ "sessionId": "string", "imageType": "FRONT | LEFT | RIGHT | UPPER_OCCLUSAL | LOWER_OCCLUSAL" }
```
**Response:** `{ url: string, key: string }`

### `POST /scans/upload/confirm`
Confirm a direct upload and create the ScanImage record.

**Auth:** Doctor JWT
**Body:**
```json
{ "sessionId": "string", "imageType": "ImageType", "key": "string" }
```
**Response:** `ScanImage`

### `POST /scans/upload`
Multipart file upload fallback (when cloud storage not configured).

**Auth:** Doctor JWT
**Content-Type:** `multipart/form-data`
**Body:** `file` (binary), `sessionId`, `imageType`
**Response:** `ScanImage`

### `GET /scans/images/:id/url`
Get a presigned download URL for a scan image.

**Auth:** Doctor JWT
**Response:** `{ url: string }`

### `GET /scans/images/:id/thumbnail-url`
Get a presigned download URL for a thumbnail.

**Auth:** Doctor JWT
**Response:** `{ url: string | null }`

---

## Tagging Module

### `POST /tagging/sessions/:sessionId/tags`
Create a tag set for a scan session. Also marks session as REVIEWED.

**Auth:** Doctor JWT
**Body:**
```json
{
  "overallTracking": "1-3 (required)",
  "alignerFit?": "1-3",
  "oralHygiene": "1-3 (required)",
  "detailTags?": ["string array"],
  "actionTaken?": "string",
  "notes?": "string",
  "aiSuggested?": "boolean",
  "aiOverridden?": "boolean"
}
```
**Response:** `TagSet` (with taggedBy doctor)

### `GET /tagging/sessions/:sessionId/tags`
Get tag set for a session.

**Auth:** Doctor JWT
**Response:** `TagSet` (with session and doctor details)
**Errors:** 404

### `POST /tagging/sessions/:sessionId/suggest`
Get AI-powered tag suggestions via Claude vision.

**Auth:** Doctor JWT
**Response:**
```json
{
  "overallTracking": 1,
  "alignerFit": 2,
  "oralHygiene": 1,
  "detailTags": ["Spacing issue"],
  "actionTaken": "Continue current stage",
  "notes": "Treatment progressing well",
  "confidence": 0.85
}
```
**Errors:** 503 (AI not configured)

### `GET /tagging/analytics`
Get practice tagging analytics.

**Auth:** Doctor JWT
**Response:** `{ taggingRate, discountPercent, totalSessions, taggedSessions, period: "30d" }`

---

## Messaging Module

### `GET /messaging/threads`
List message threads with unread counts.

**Auth:** Doctor JWT
**Response:** `ThreadResponseDto[]` (sorted by updatedAt desc)

### `GET /messaging/threads/:id`
Get a thread with all messages.

**Auth:** Doctor JWT
**Response:** `ThreadResponseDto` (messages ordered asc)

### `POST /messaging/threads`
Create a new message thread.

**Auth:** Doctor JWT
**Body:**
```json
{ "patientId": "string", "subject": "string" }
```
**Response:** `ThreadResponseDto`

### `POST /messaging/messages`
Send a message in a thread.

**Auth:** Doctor JWT
**Body:**
```json
{ "threadId": "string", "content": "string", "senderType?": "DOCTOR | PATIENT | SYSTEM" }
```
**Response:** `MessageResponseDto`
**Note:** `senderType` auto-detected from JWT if not provided.

### `PATCH /messaging/messages/:id/read`
Mark a message as read.

**Auth:** Doctor JWT
**Response:** `MessageResponseDto` (with readAt set)

---

## Dashboard Module

### `GET /dashboard/summary`
Get dashboard summary metrics.

**Auth:** Doctor JWT
**Response:** `{ pendingScans, totalPatients, compliancePercentage, taggingRate }`

### `GET /dashboard/feed`
Get recent activity feed.

**Auth:** Doctor JWT
**Response:** `Feed[]` (unified items: scan_session, message, tag_submission — sorted newest-first)

### `GET /dashboard/compliance`
Get patient compliance statistics.

**Auth:** Doctor JWT
**Response:**
```json
{
  "totalActive": 10,
  "onTimeCount": 8,
  "overdueCount": 2,
  "compliancePercentage": 80,
  "overduePatients": [{ "id": "...", "name": "...", "daysSinceLastScan": 21 }]
}
```

### `GET /dashboard/tagging-rate`
Get tagging rate statistics.

**Auth:** Doctor JWT
**Response:** `{ totalSessions, taggedSessions, taggingRate, periodDays: 30 }`

---

## Patient Portal Module

All endpoints require `PatientAuthGuard` (patient JWT).

### `GET /patient/profile`
Get patient profile with treatment progress.

**Response:** `{ id, name, email, treatmentType, alignerBrand, currentStage, totalStages, scanFrequency, status, doctorName, lastScanDate, nextScanDue, practiceSettings: { messagingMode, whatsappNumber? } }`

### `GET /patient/scans`
List patient's own scan sessions.

**Response:** `ScanSession[]`

### `POST /patient/scans/sessions`
Create a new scan session.

**Response:** `ScanSession`

### `POST /patient/scans/upload-url`
Get presigned upload URL.

**Body:** `{ sessionId, imageType }`
**Response:** `{ url, key }`

### `POST /patient/scans/upload/confirm`
Confirm upload.

**Body:** `{ sessionId, imageType, key }`
**Response:** `ScanImage`

### `POST /patient/scans/upload`
Multipart upload fallback.

**Body:** `file`, `sessionId`, `imageType`
**Response:** `ScanImage`

### `GET /patient/scans/images/:id/url`
Get presigned download URL for an image.

**Response:** `{ url }`

### `GET /patient/messages`
List patient's message threads.

**Response:** `Thread[]` (with unreadCount)

### `GET /patient/messages/:threadId`
Get a thread with all messages.

**Response:** `MessageThread` (with messages)

### `POST /patient/messages`
Send a message. senderType auto-set to PATIENT.

**Body:** `{ threadId, content }`
**Response:** `Message`

### `PATCH /patient/messages/:messageId/read`
Mark a message as read.

**Response:** `Message`

---

## Patient Push Notifications Module

### `GET /patient/push/vapid-public-key` `@Public`
Get the VAPID public key for push subscription.

**Response:** `{ key: string | null }`

### `POST /patient/push/subscribe`
Subscribe to push notifications.

**Auth:** Patient JWT (PatientAuthGuard)
**Body:**
```json
{
  "endpoint": "string (required)",
  "keys": { "p256dh": "string (required)", "auth": "string (required)" },
  "userAgent?": "string"
}
```
**Response:** `PushSubscription`

### `DELETE /patient/push/unsubscribe`
Unsubscribe from push notifications.

**Auth:** Patient JWT (PatientAuthGuard)
**Body:**
```json
{ "endpoint": "string (required)" }
```
**Response:** `{ count: number }`
