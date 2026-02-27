# Doctor Dashboard (apps/web)

**Framework:** Next.js 14 (App Router)
**Port:** 3001
**Path:** `apps/web/`

## Architecture

```
apps/web/src/
├── app/
│   ├── page.tsx                    # Root redirect → /dashboard
│   ├── layout.tsx                  # Root layout (providers)
│   ├── (auth)/
│   │   ├── layout.tsx              # Centered auth layout
│   │   └── login/page.tsx          # Doctor login
│   └── (dashboard)/
│       ├── layout.tsx              # Sidebar + TopBar + auth gate
│       ├── dashboard/page.tsx      # Home dashboard
│       ├── patients/
│       │   ├── page.tsx            # Patient list
│       │   ├── new/page.tsx        # Create patient
│       │   └── [id]/page.tsx       # Patient detail
│       ├── scans/
│       │   ├── page.tsx            # Scan list
│       │   └── [id]/page.tsx       # Scan detail + tagging
│       ├── messages/
│       │   ├── page.tsx            # Thread list
│       │   └── [threadId]/page.tsx # Thread conversation
│       └── settings/page.tsx       # Practice settings
├── components/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   ├── hooks/
│   ├── types.ts
│   ├── constants.ts
│   └── utils.ts
└── providers/
```

## Auth

**Dual-mode** via `AuthProvider` (`apps/web/src/providers/auth-provider.tsx`):

- **Local mode** (default): Email/password login, JWT stored in localStorage as `auth_token`
- **Auth0 mode** (when `NEXT_PUBLIC_AUTH0_DOMAIN` is set): Auth0 SDK login, Auth0 button on login page

**Context:** `useAuthContext()` → `{ user, loading, isAuthenticated, login, loginWithAuth0, logout, auth0Enabled }`

**API Client** (`apps/web/src/lib/api-client.ts`):
- Axios instance with base URL from env
- Request interceptor: attaches `Authorization: Bearer {token}`
- Response interceptor: on 401, clears auth and redirects to `/login`

---

## Pages

### Login (`(auth)/login/page.tsx`)
- Email + password form
- Auth0 button (shown when `auth0Enabled`)
- Error messages inline
- On success: saves token + user to localStorage, redirects to `/dashboard`

### Dashboard (`(dashboard)/dashboard/page.tsx`)
- **4 stat cards:** Pending Scans, Total Patients, Compliance %, Tagging Rate
- **Recent Activity feed:** `ScanFeedCard` components showing scan sessions, messages, tag submissions
- **Tagging Rate Widget:** Progress bar, session counts, and current discount tier
- **Hooks:** `useDashboardSummary()`, `useDashboardFeed()`, `useTagAnalytics()`

### Patients List (`(dashboard)/patients/page.tsx`)
- Search input (filters by name)
- Status filter dropdown (ACTIVE / PAUSED / COMPLETED / DROPPED)
- `PatientTable` component with pagination
- "Add Patient" button → `/patients/new`
- **Hook:** `usePatients(search, status, page)`

### New Patient (`(dashboard)/patients/new/page.tsx`)
- Form: Name, Doctor ID, Treatment Type, Aligner Brand, Total Stages, Scan Frequency
- Creates patient, redirects to `/patients`
- **Hook:** `useCreatePatient()`

### Patient Detail (`(dashboard)/patients/[id]/page.tsx`)
- Patient info card (treatment type, aligner brand, stage progress, scan frequency, DOB)
- Scan history list with links to scan details
- "Invite to Portal" button → opens `InvitePatientDialog`
- **Hooks:** `usePatient(id)`, `useScans({ patientId })`

### Scans List (`(dashboard)/scans/page.tsx`)
- Status filter (PENDING / REVIEWED / FLAGGED)
- Scan cards: patient name, image count, relative time, status badge
- Click → `/scans/{id}`
- **Hook:** `useScans(status)`

### Scan Detail (`(dashboard)/scans/[id]/page.tsx`)
- Patient name, timestamp, status badge
- Upload Image button → `UploadImageDialog`
- **Left panel (2/3):** `ScanImageViewer` — thumbnail grid + full-size viewer
- **Right panel (1/3):** `TaggingPanel` — scoring, detail tags, AI suggestions, submit
- **Hooks:** `useScan(id)`, `useAiSuggest()`, `useSubmitTags()`

### Messages List (`(dashboard)/messages/page.tsx`)
- Thread list: subject, last message preview, unread count badge, relative time
- "New Thread" button → `NewThreadDialog` (patient selector + subject)
- **Hooks:** `useThreads()`, `useCreateThread()`

### Thread Detail (`(dashboard)/messages/[threadId]/page.tsx`)
- Thread subject header
- Message bubbles: doctor (left, white), patient (right, blue)
- Timestamps on each message
- Input form at bottom, auto-refocuses after send
- Full viewport height with scrollable area
- **Hooks:** `useThread(id)`, `useSendMessage()`

### Settings (`(dashboard)/settings/page.tsx`)
- **Practice Information** (editable): name, address, phone — save button
- **Patient Messaging** (editable): radio toggle between "In-App Portal" and "WhatsApp" mode. When WhatsApp is selected, a phone number input appears (digits only, international format). Separate save button calls `PATCH /practices/:id/settings`
- **Subscription & Performance** (read-only): tier, tagging rate %, discount %
- **Hooks:** `usePractice()`, `useUpdatePractice()`, `useUpdatePracticeSettings()`

---

## Key Components

### Layout
| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `components/sidebar.tsx` | Desktop sidebar + mobile drawer. Nav: Dashboard, Scans, Patients, Messages, Settings. Auto-closes on route change. |
| `TopBar` | `components/top-bar.tsx` | Header with user name, logout button, online status indicator |
| `NavLink` | `components/nav-link.tsx` | Nav item with active state styling |

### Scan Components
| Component | File | Description |
|-----------|------|-------------|
| `ScanImageViewer` | `components/scans/scan-image-viewer.tsx` | Main viewer + thumbnail grid. Eager thumbnail URL fetching, lazy full image on click. |
| `TaggingPanel` | `components/scans/tagging-panel.tsx` | Score toggles (1-2-3), detail tags, action, notes, AI suggest button, submit. Tracks `aiSuggested`/`aiOverridden`. |
| `TagChips` | `components/scans/tag-chips.tsx` | Display-only colored tag indicators |
| `UploadImageDialog` | `components/scans/upload-image-dialog.tsx` | Image type selector, drag-drop zone, camera capture (mobile), 10MB limit |

### Patient Components
| Component | File | Description |
|-----------|------|-------------|
| `PatientTable` | `components/patients/patient-table.tsx` | Table: Name, Treatment, Stage, Status, Frequency. Pagination controls. |
| `PatientForm` | `components/patients/patient-form.tsx` | Create/edit form with all patient fields |
| `InvitePatientDialog` | `components/patients/invite-patient-dialog.tsx` | Generate invite link, show URL with copy button |

### Dashboard Components
| Component | File | Description |
|-----------|------|-------------|
| `ScanFeedCard` | `components/dashboard/scan-feed-card.tsx` | Event card: type, date, status badge |
| `TaggingRateWidget` | `components/dashboard/tagging-rate-widget.tsx` | Tagging rate %, progress bar, discount tier |

### Messages
| Component | File | Description |
|-----------|------|-------------|
| `NewThreadDialog` | `components/messages/new-thread-dialog.tsx` | Patient dropdown + subject input |

---

## Hooks

All hooks are in `apps/web/src/lib/hooks/`.

| File | Exports | API Endpoints |
|------|---------|---------------|
| `use-patients.ts` | `usePatients()`, `usePatient()`, `useCreatePatient()`, `useUpdatePatient()` | `/patients` |
| `use-scans.ts` | `useScans()`, `useScan()`, `useCreateScanSession()` | `/scans/sessions` |
| `use-dashboard.ts` | `useDashboardSummary()`, `useDashboardFeed()`, `useComplianceStats()` | `/dashboard/*` |
| `use-messages.ts` | `useThreads()`, `useThread()`, `useCreateThread()`, `useSendMessage()` | `/messaging/*` |
| `use-tagging.ts` | `useSessionTags()`, `useSubmitTags()`, `useAiSuggest()`, `useTagAnalytics()` | `/tagging/*` |
| `use-upload.ts` | `useUploadScanImage()`, `fetchImageUrl()`, `fetchThumbnailUrl()` | `/scans/upload/*`, `/scans/images/*` |
| `use-patient-invite.ts` | `useInvitePatient()` | `/patients/:id/invite` |
| `use-practices.ts` | `usePractice()`, `useUpdatePractice()`, `useUpdatePracticeSettings()` | `/practices`, `/practices/:id/settings` |
| `use-online-status.ts` | `useOnlineStatus()` | N/A (browser API) |

---

## Providers

| Provider | File | Description |
|----------|------|-------------|
| `AuthProvider` | `providers/auth-provider.tsx` | Dual-mode: `LocalAuthProvider` or `Auth0AuthProvider` |
| `QueryProvider` | `providers/query-provider.tsx` | TanStack Query with 60s staleTime, 1 retry |
| `SidebarProvider` | `providers/sidebar-provider.tsx` | Mobile sidebar state, Escape key handler |

---

## Configuration

**Next.js config** (`apps/web/next.config.js`):
- PWA via `next-pwa` (disabled in dev)
- API rewrites: `/api/v1/*` → `http://localhost:8085/api/v1/*`

**Dependencies:** Next.js 14.1, React 18, React Query 5.17, Axios, @auth0/auth0-react (optional), Tailwind CSS, lucide-react, date-fns
