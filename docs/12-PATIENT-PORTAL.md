# Patient Portal (apps/patient)

**Framework:** Next.js 14 (App Router, PWA)
**Port:** 3002
**Path:** `apps/patient/`
**Design:** Mobile-first with bottom navigation

## Architecture

```
apps/patient/src/
├── app/
│   ├── page.tsx                        # Root: redirect based on auth
│   ├── layout.tsx                      # Root layout (providers)
│   ├── (auth)/
│   │   ├── layout.tsx                  # Centered auth layout
│   │   ├── login/page.tsx              # Patient login
│   │   └── register/[token]/page.tsx   # Invite-based registration
│   └── (app)/
│       ├── layout.tsx                  # Protected layout + bottom nav
│       ├── home/page.tsx               # Treatment progress
│       ├── scan/page.tsx               # Scan wizard
│       └── messages/
│           ├── page.tsx                # Thread list
│           └── [threadId]/page.tsx     # Thread conversation
├── components/
│   ├── bottom-nav.tsx
│   ├── patient-header.tsx
│   ├── scan/                           # Scan wizard components
│   ├── messages/                       # Message components
│   └── ui/                             # shadcn-style components
├── lib/
│   ├── api-client.ts
│   ├── hooks/
│   ├── types.ts
│   ├── constants.ts
│   └── utils.ts
└── providers/
    ├── query-provider.tsx
    └── patient-auth-provider.tsx
```

## Auth

**Provider:** `PatientAuthProvider` (`apps/patient/src/providers/patient-auth-provider.tsx`)

- **Storage:** `patient_token` and `patient_data` in localStorage
- **Context:** `usePatientAuth()` → `{ isAuthenticated, isLoading, patient, login, register, logout }`
- **Auto-redirect:** Unauthenticated users on protected routes → `/login`

**API Client** (`apps/patient/src/lib/api-client.ts`):
- Axios instance reading `patient_token` from localStorage
- On 401 → clears storage, redirects to `/login`

---

## Pages

### Root (`page.tsx`)
Checks auth state, redirects to `/home` (authenticated) or `/login` (not).

### Login (`(auth)/login/page.tsx`)
- Email + password form
- Sign-in button
- Link to register (if they have an invite)
- **Hook:** `usePatientAuth().login()`

### Register (`(auth)/register/[token]/page.tsx`)
Invite-based registration flow:

1. On mount: `GET /patient-auth/validate-invite/{token}`
2. Shows loading skeleton while validating
3. If invalid/expired: shows error card
4. If valid: shows registration form with:
   - Pre-filled email (from invite)
   - Password field (min 8 chars)
   - Confirm password field
5. On submit: `POST /patient-auth/register` with `{ token, email, password }`
6. On success: saves token + patient data, redirects to `/home`

### Home (`(app)/home/page.tsx`)
Patient's treatment overview:

1. **Treatment Progress card:**
   - Stage X of Y progress bar
   - Treatment type and aligner brand
2. **Next Scan Due card:**
   - Shows due date (calculated from last scan + scanFrequency)
   - Red ring indicator if overdue
   - "No scans yet" if no history
3. **Recent Scans list:**
   - Last 5 scan sessions
   - Date, image count, status badge

**Hooks:** `usePatientProfile()`, `usePatientScans()`

### Scan (`(app)/scan/page.tsx`)
Hosts the `ScanWizard` component. See detailed section below.

### Messages List (`(app)/messages/page.tsx`)
- Thread list with `ThreadListItem` components
- Empty state (icon + message) when no threads
- Loading skeletons
- **Hook:** `usePatientThreads()`

### Thread Detail (`(app)/messages/[threadId]/page.tsx`)
- Back button → `/messages`
- Thread subject header
- `MessageBubble` components with auto-scroll to bottom
- Auto-marks unread doctor/system messages as read
- Input form with rounded send button (send icon)
- Full viewport height flex layout
- **Hooks:** `usePatientThread(id)`, `useSendPatientMessage()`, `useMarkMessageRead()`

---

## Scan Wizard (Detailed)

**Component:** `apps/patient/src/components/scan/scan-wizard.tsx`

### State Machine

```
intro → capture → review → uploading → done
                    ↑          │
                    └──────────┘ (on error, retry)
```

### Step 1: Intro
- Shows all 5 photo type icons (FRONT, LEFT, RIGHT, UPPER_OCCLUSAL, LOWER_OCCLUSAL)
- Instructions text
- "Start Scan" button → transitions to `capture`

### Step 2: Capture (5 iterations)
For each of the 5 image types:

1. **AnglePrompt** component shows:
   - Step indicator: "Photo 1 of 5"
   - Camera icon
   - Angle name (e.g., "Front View")
   - Instructions (from `ANGLE_INSTRUCTIONS` constant)

2. **CameraCapture** component shows:
   - Tap-to-capture button (triggers `<input type="file" accept="image/*" capture="environment">`)
   - After capture: image preview with "Retake" button

3. Navigation: Back / Next buttons
   - Back: go to previous angle
   - Next: save photo and advance to next angle

### Step 3: Review
- Grid of captured photos (thumbnails)
- Missing photos shown as placeholders
- "Retake" button per photo → goes back to that angle's capture step
- "Upload" button → transitions to `uploading`

### Step 4: Uploading
- **UploadProgress** component shows:
  - Progress bar with percentage
  - Counter: "2 of 5 photos uploaded (40%)"

Upload process:
1. `POST /patient/scans/sessions` → create scan session
2. For each captured photo:
   a. `POST /patient/scans/upload-url` → get presigned URL + key
   b. `PUT` to presigned URL (direct upload to S3)
   c. `POST /patient/scans/upload/confirm` → confirm + create ScanImage

### Step 5: Done
- Success message with checkmark
- "Take Another Scan" button → resets wizard to intro

### Error State
- Shows error message if upload fails
- "Try Again" button → retries from uploading step

---

## Key Components

### Layout
| Component | Description |
|-----------|-------------|
| `BottomNav` | Fixed bottom bar: Home, Scan, Messages icons. Active state. Unread badge on Messages. `safe-area-bottom` for notch devices. |
| `PatientHeader` | Sticky top header: MyOrtho branding, patient name, logout button |

### Scan Components
| Component | Description |
|-----------|-------------|
| `ScanWizard` | State machine orchestrating the 5-step scan flow |
| `CameraCapture` | File input with `capture="environment"`, preview, retake |
| `AnglePrompt` | Step indicator, camera icon, angle name, instructions |
| `UploadProgress` | Progress bar + counter |

### Message Components
| Component | Description |
|-----------|-------------|
| `ThreadListItem` | Circle icon, subject, last message preview, unread badge, time |
| `MessageBubble` | Doctor (left, gray), Patient (right, blue), System (center, gray). Timestamp. `whitespace-pre-wrap`. |

---

## Hooks

| File | Exports | API Endpoints |
|------|---------|---------------|
| `use-patient-profile.ts` | `usePatientProfile()` | `GET /patient/profile` |
| `use-patient-scans.ts` | `usePatientScans()` | `GET /patient/scans` |
| `use-patient-messages.ts` | `usePatientThreads()`, `usePatientThread()`, `useSendPatientMessage()`, `useMarkMessageRead()` | `/patient/messages/*` |
| `use-scan-upload.ts` | `useCreateScanSession()`, `useUploadScanImage()` | `/patient/scans/*` |

---

## Constants

**File:** `apps/patient/src/lib/constants.ts`

Key constants:
- `IMAGE_TYPES` — ordered array of 5 angle types
- `IMAGE_TYPE_LABELS` — display names
- `STATUS_LABELS` / `STATUS_COLORS` — status display
- `ANGLE_INSTRUCTIONS` — per-angle photo guidance text for the scan wizard

---

## Configuration

**Next.js config** (`apps/patient/next.config.js`):
- PWA via `next-pwa` (disabled in dev)
- API rewrites: `/api/v1/*` → `http://localhost:3001/api/v1/*`

**Dependencies:** Next.js 14.1, React 18, React Query 5.17, Axios, Tailwind CSS, lucide-react, date-fns

**Design:** Mobile-first, max-width 32rem (lg breakpoint), bottom navigation
