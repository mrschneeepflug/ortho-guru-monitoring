# Data Flows

End-to-end flows showing how data moves through the system for key operations.

---

## 1. Patient Onboarding

```
Doctor Dashboard                 API                              Database
     │                            │                                  │
     │ POST /patients             │                                  │
     │ { name, doctorId, ... }    │                                  │
     │───────────────────────────>│                                  │
     │                            │  Create Patient record           │
     │                            │─────────────────────────────────>│
     │                            │                                  │
     │ POST /patients/:id/invite  │                                  │
     │ { email }                  │                                  │
     │───────────────────────────>│                                  │
     │                            │  crypto.randomBytes(32).hex()    │
     │                            │  Create PatientInvite            │
     │                            │  (token, 7-day expiry)           │
     │                            │─────────────────────────────────>│
     │                            │                                  │
     │ { token, inviteUrl,        │                                  │
     │   expiresAt }              │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  Doctor shares inviteUrl   │                                  │
     │  with patient              │                                  │
     │                            │                                  │

Patient Portal                   API                              Database
     │                            │                                  │
     │  Patient opens inviteUrl   │                                  │
     │  /register/{token}         │                                  │
     │                            │                                  │
     │ GET /patient-auth/         │                                  │
     │   validate-invite/:token   │                                  │
     │───────────────────────────>│                                  │
     │                            │  Check token exists,             │
     │                            │  not expired, not used           │
     │ { valid, patientName,      │                                  │
     │   email }                  │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │ POST /patient-auth/register│                                  │
     │ { token, email, password } │                                  │
     │───────────────────────────>│                                  │
     │                            │  Transaction:                    │
     │                            │  1. Validate invite              │
     │                            │  2. bcrypt.hash(password)        │
     │                            │  3. Update Patient (email, hash) │
     │                            │  4. Mark invite usedAt=now()     │
     │                            │  5. Sign JWT (1-hour access,     │
     │                            │     type: 'patient')             │
     │                            │  6. Create refresh token         │
     │                            │     (30-day, httpOnly cookie)    │
     │                            │─────────────────────────────────>│
     │                            │                                  │
     │ { accessToken, patient }   │                                  │
     │ + Set-Cookie: patient_     │                                  │
     │   refresh (httpOnly)       │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  Save accessToken to       │                                  │
     │  localStorage              │                                  │
     │  Redirect to /home         │                                  │
```

---

## 2. Scan Upload (Patient)

```
Patient Portal                   API                     S3/OCI         Database
     │                            │                        │              │
     │  [Scan Wizard: Capture     │                        │              │
     │   5 photos]                │                        │              │
     │                            │                        │              │
     │ POST /patient/scans/       │                        │              │
     │   sessions                 │                        │              │
     │───────────────────────────>│                        │              │
     │                            │  Create ScanSession    │              │
     │                            │  (PENDING, count: 0)   │              │
     │                            │──────────────────────────────────────>│
     │  { id, status: PENDING }   │                        │              │
     │<───────────────────────────│                        │              │
     │                            │                        │              │
     │  [For each of 5 photos:]   │                        │              │
     │                            │                        │              │
     │ POST /patient/scans/       │                        │              │
     │   upload-url               │                        │              │
     │ { sessionId, imageType }   │                        │              │
     │───────────────────────────>│                        │              │
     │                            │  buildKey()            │              │
     │                            │  generateUploadUrl()───>              │
     │  { url, key }              │                        │              │
     │<───────────────────────────│                        │              │
     │                            │                        │              │
     │  PUT url (image binary) ───────────────────────────>│              │
     │  200 OK <──────────────────────────────────────────│              │
     │                            │                        │              │
     │ POST /patient/scans/       │                        │              │
     │   upload/confirm           │                        │              │
     │ { sessionId, imageType,    │                        │              │
     │   key }                    │                        │              │
     │───────────────────────────>│                        │              │
     │                            │  Create ScanImage      │              │
     │                            │  Increment imageCount  │              │
     │                            │──────────────────────────────────────>│
     │                            │                        │              │
     │                            │  Generate thumbnail:   │              │
     │                            │  getObject(key) ───────>              │
     │                            │  Sharp(300x300, webp)  │              │
     │                            │  putObject(thumbKey) ──>              │
     │                            │  Update ScanImage      │              │
     │                            │    thumbnailKey        │              │
     │                            │──────────────────────────────────────>│
     │                            │                        │              │
     │  ScanImage                 │                        │              │
     │<───────────────────────────│                        │              │
     │                            │                        │              │
     │  [Upload progress: x/5]    │                        │              │
     │  [Repeat for remaining]    │                        │              │
```

---

## 3. Scan Review (Doctor)

```
Doctor Dashboard                 API                              Database
     │                            │                                  │
     │ GET /scans/sessions        │                                  │
     │ ?status=PENDING            │                                  │
     │───────────────────────────>│                                  │
     │                            │  Query sessions WHERE            │
     │                            │  status=PENDING, practiceId      │
     │  { items: [...] }          │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  Doctor clicks a scan      │                                  │
     │                            │                                  │
     │ GET /scans/sessions/:id    │                                  │
     │───────────────────────────>│                                  │
     │                            │  Load session + images + tagSet  │
     │  ScanSession               │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  [ScanImageViewer loads    │                                  │
     │   thumbnail URLs, then     │                                  │
     │   full image on click]     │                                  │
     │                            │                                  │
     │  (Optional) Doctor clicks  │                                  │
     │  "Get AI Suggestion"       │                                  │
     │                            │                                  │
     │ POST /tagging/sessions/    │                        S3/OCI    │
     │   :sessionId/suggest       │                          │       │
     │───────────────────────────>│                          │       │
     │                            │  Load images from S3 ───>│       │
     │                            │  Encode as base64        │       │
     │                            │  Call Claude Vision      │       │
     │                            │  (Anthropic API)         │       │
     │                            │  Validate/clamp response │       │
     │  AiTagSuggestion           │                          │       │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  Form populated with AI    │                                  │
     │  values. Doctor reviews    │                                  │
     │  and optionally overrides. │                                  │
     │                            │                                  │
     │ POST /tagging/sessions/    │                                  │
     │   :sessionId/tags          │                                  │
     │ { overallTracking: 1,      │                                  │
     │   oralHygiene: 2,          │                                  │
     │   detailTags: [...],       │                                  │
     │   aiSuggested: true,       │                                  │
     │   aiOverridden: false }    │                                  │
     │───────────────────────────>│                                  │
     │                            │  Transaction:                    │
     │                            │  1. Create TagSet                │
     │                            │  2. Update ScanSession           │
     │                            │     status=REVIEWED              │
     │                            │     reviewedAt=now()             │
     │                            │     reviewedById=doctor.id       │
     │                            │─────────────────────────────────>│
     │  TagSet                    │                                  │
     │<───────────────────────────│                                  │
```

---

## 4. Messaging

```
Doctor Dashboard                 API                              Database
     │                            │                                  │
     │ POST /messaging/threads    │                                  │
     │ { patientId, subject }     │                                  │
     │───────────────────────────>│                                  │
     │                            │  Verify patient in practice      │
     │                            │  Create MessageThread            │
     │                            │─────────────────────────────────>│
     │  ThreadResponseDto         │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │ POST /messaging/messages   │                                  │
     │ { threadId, content }      │                                  │
     │───────────────────────────>│                                  │
     │                            │  Auto-detect senderType=DOCTOR   │
     │                            │  Create Message                  │
     │                            │  Update thread.updatedAt         │
     │                            │─────────────────────────────────>│
     │  MessageResponseDto        │                                  │
     │<───────────────────────────│                                  │

Patient Portal                   API                              Database
     │                            │                                  │
     │ GET /patient/messages      │                                  │
     │───────────────────────────>│                                  │
     │                            │  Find threads for patientId      │
     │                            │  Calculate unreadCount           │
     │                            │  (where readAt IS NULL AND       │
     │                            │   senderType != PATIENT)         │
     │  Thread[] with unreadCount │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  Patient opens thread      │                                  │
     │                            │                                  │
     │ GET /patient/messages/     │                                  │
     │   :threadId                │                                  │
     │───────────────────────────>│                                  │
     │  Thread with messages      │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │  Auto-mark doctor msgs     │                                  │
     │  as read                   │                                  │
     │ PATCH /patient/messages/   │                                  │
     │   :messageId/read          │                                  │
     │───────────────────────────>│  Set readAt = now()              │
     │                            │─────────────────────────────────>│
     │                            │                                  │
     │ POST /patient/messages     │                                  │
     │ { threadId, content }      │                                  │
     │───────────────────────────>│                                  │
     │                            │  senderType auto-set to PATIENT  │
     │                            │  Create Message                  │
     │                            │─────────────────────────────────>│
     │  Message                   │                                  │
     │<───────────────────────────│                                  │
```

---

## 5. Dashboard Analytics

```
Doctor Dashboard                 API                              Database
     │                            │                                  │
     │ GET /dashboard/summary     │                                  │
     │───────────────────────────>│                                  │
     │                            │  pendingScans = count sessions   │
     │                            │    WHERE status=PENDING          │
     │                            │  totalPatients = count patients  │
     │                            │    WHERE status=ACTIVE           │
     │                            │  compliancePercentage =          │
     │                            │    on-time / total active        │
     │                            │  taggingRate = tagged / total    │
     │                            │    (last 30 days)                │
     │  { pendingScans,           │                                  │
     │    totalPatients,          │                                  │
     │    compliancePercentage,   │                                  │
     │    taggingRate }           │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │ GET /dashboard/feed        │                                  │
     │───────────────────────────>│                                  │
     │                            │  Fetch 20 recent scans           │
     │                            │  Fetch 10 recent messages        │
     │                            │  Fetch 10 recent tag submissions │
     │                            │  Merge and sort by date DESC     │
     │  Feed[]                    │                                  │
     │<───────────────────────────│                                  │
     │                            │                                  │
     │ GET /tagging/analytics     │                                  │
     │───────────────────────────>│                                  │
     │                            │  30-day window:                  │
     │                            │  totalSessions = count all       │
     │                            │  taggedSessions = count w/ tagSet│
     │                            │  taggingRate = tagged/total*100  │
     │                            │  discountTier:                   │
     │                            │    85%+ → 30%                    │
     │                            │    70-84% → 20%                  │
     │                            │    50-69% → 10%                  │
     │                            │    <50% → 0%                     │
     │                            │  Persist to Practice record      │
     │  TagAnalytics              │                                  │
     │<───────────────────────────│                                  │
```

---

## 6. Push Notification Flow

### Subscription

```
Patient Portal                   API                              Database
     │                            │                                  │
     │  [Home page loads,         │                                  │
     │   PushPrompt renders]      │                                  │
     │                            │                                  │
     │  Patient taps "Enable      │                                  │
     │  Notifications"            │                                  │
     │                            │                                  │
     │  Notification.request      │                                  │
     │  Permission() → "granted"  │                                  │
     │                            │                                  │
     │  pushManager.subscribe()   │                                  │
     │  → PushSubscription        │                                  │
     │                            │                                  │
     │ POST /patient/push/        │                                  │
     │   subscribe                │                                  │
     │ { endpoint, keys }         │                                  │
     │───────────────────────────>│                                  │
     │                            │  Upsert PushSubscription         │
     │                            │  (by endpoint)                   │
     │                            │─────────────────────────────────>│
     │  PushSubscription          │                                  │
     │<───────────────────────────│                                  │
```

### Notification Delivery (e.g., Scan Reviewed)

```
Doctor Dashboard                 API                       Push Service    Patient Device
     │                            │                            │                │
     │ PATCH /scans/sessions/     │                            │                │
     │   :id/status               │                            │                │
     │ { status: "REVIEWED" }     │                            │                │
     │───────────────────────────>│                            │                │
     │                            │  Update ScanSession        │                │
     │                            │  status=REVIEWED           │                │
     │                            │                            │                │
     │                            │  EventEmitter2.emit(       │                │
     │                            │    'scan.reviewed',        │                │
     │                            │    { sessionId, patientId })                │
     │                            │         │                  │                │
     │                            │  NotificationsListener     │                │
     │                            │  @OnEvent('scan.reviewed') │                │
     │                            │         │                  │                │
     │                            │  NotificationsService      │                │
     │                            │  .sendToPatient()          │                │
     │                            │    Load PushSubscriptions  │                │
     │                            │    for patientId           │                │
     │                            │         │                  │                │
     │                            │  webPush.sendNotification()│                │
     │                            │────────────────────────────>                │
     │                            │                            │  Push to device│
     │                            │                            │───────────────>│
     │                            │                            │                │
     │                            │                            │     SW: push event
     │                            │                            │     showNotification()
     │                            │                            │     "Scan Reviewed"
     │                            │                            │                │
     │                            │                            │     User taps  │
     │                            │                            │     notification│
     │                            │                            │                │
     │                            │                            │     SW: notificationclick
     │                            │                            │     navigate → /home
     │  ScanSession               │                            │                │
     │<───────────────────────────│                            │                │
```

---

### Compliance Calculation Detail

```
For each ACTIVE patient:
  lastScanDate = max(scanSession.createdAt) for that patient
  daysSinceLastScan = today - lastScanDate
  expectedFrequency = patient.scanFrequency (default: 14 days)

  if daysSinceLastScan <= expectedFrequency:
    → ON TIME
  else:
    → OVERDUE (include in overduePatients list)

compliancePercentage = (onTimeCount / totalActive) * 100
```
