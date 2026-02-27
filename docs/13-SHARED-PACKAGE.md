# Shared Package (packages/shared)

**Path:** `packages/shared/`
**Build output:** `packages/shared/dist/`
**Entry point:** `packages/shared/dist/index.js`

## Package Structure

```
packages/shared/
├── src/
│   ├── index.ts                # Re-exports everything
│   ├── types/
│   │   ├── user.ts
│   │   ├── practice.ts
│   │   ├── patient.ts
│   │   ├── scan.ts
│   │   ├── tagging.ts
│   │   └── messaging.ts
│   ├── constants/
│   │   └── tags.ts
│   └── __tests__/
│       └── tags.test.ts
├── tsconfig.json
├── package.json
└── vitest.config.ts (if present)
```

## Build & Test

```bash
# Build (compile TypeScript → dist/)
npx pnpm --filter shared build

# Test
npx pnpm --filter shared test

# Watch mode
npx pnpm --filter shared test:watch
```

**Important:** Rebuild the shared package after modifying types or constants. The API and frontend apps import from the compiled `dist/` output.

---

## Type Definitions

### user.ts

```typescript
type DoctorRole = 'ADMIN' | 'DOCTOR' | 'HYGIENIST';

interface User {
  id: string;
  practiceId: string;
  name: string;
  email: string;
  role: DoctorRole;
  credentials?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  practiceId: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  practiceId: string;
}
```

### practice.ts

```typescript
interface Practice {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  subscriptionTier: string;
  taggingRate: number;
  discountPercent: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### patient.ts

```typescript
type PatientStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED';

interface Patient {
  id: string;
  practiceId: string;
  doctorId: string;
  name: string;
  email?: string;
  dateOfBirth?: string;
  treatmentType?: string;
  alignerBrand?: string;
  currentStage: number;
  totalStages?: number;
  scanFrequency: number;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
  doctor?: { name: string };
}
```

### scan.ts

```typescript
type ScanStatus = 'PENDING' | 'REVIEWED' | 'FLAGGED';
type ImageType = 'FRONT' | 'LEFT' | 'RIGHT' | 'UPPER_OCCLUSAL' | 'LOWER_OCCLUSAL';

interface ScanSession {
  id: string;
  patientId: string;
  status: ScanStatus;
  imageCount: number;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  images?: ScanImage[];
  tagSet?: TagSet;
}

interface ScanImage {
  id: string;
  sessionId: string;
  imageType: ImageType;
  s3Key?: string;
  thumbnailKey?: string;
  localPath?: string;
  qualityScore?: number;
  createdAt: string;
}
```

### tagging.ts

```typescript
interface TagSet {
  id: string;
  sessionId: string;
  taggedById: string;
  overallTracking: number;    // 1-3
  alignerFit?: number;        // 1-3 or null
  oralHygiene: number;        // 1-3
  detailTags: string[];
  actionTaken?: string;
  notes?: string;
  aiSuggested: boolean;
  aiOverridden: boolean;
  createdAt: string;
  updatedAt: string;
  taggedBy?: { name: string };
}

interface TagAnalytics {
  taggingRate: number;
  discountPercent: number;
  totalSessions: number;
  taggedSessions: number;
  period: string;
}
```

### messaging.ts

```typescript
type SenderType = 'DOCTOR' | 'PATIENT' | 'SYSTEM';

interface MessageThread {
  id: string;
  patientId: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  patient?: { name: string };
  unreadCount?: number;
  lastMessage?: Message;
}

interface Message {
  id: string;
  threadId: string;
  senderType: SenderType;
  senderId: string;
  content: string;
  attachments: unknown[];
  readAt?: string;
  createdAt: string;
}
```

---

## Constants

### tags.ts

```typescript
// Score scale
const TAG_SCORES = { GOOD: 1, FAIR: 2, POOR: 3 };
const TAG_LABELS = { 1: 'Good', 2: 'Fair', 3: 'Poor' };

// Category keys
const TAG_CATEGORIES = {
  OVERALL_TRACKING: 'overallTracking',
  ALIGNER_FIT: 'alignerFit',
  ORAL_HYGIENE: 'oralHygiene',
};

// Detail tags (multi-select, 12 options)
const DETAIL_TAG_OPTIONS = [
  'Attachment missing',
  'Aligner not seating',
  'Spacing issue',
  'Crowding',
  'Open bite',
  'Crossbite',
  'Gingival inflammation',
  'Plaque buildup',
  'Decalcification',
  'Elastic wear compliance',
  'IPR needed',
  'Refinement needed',
];

// Image types
const IMAGE_TYPES = ['FRONT', 'LEFT', 'RIGHT', 'UPPER_OCCLUSAL', 'LOWER_OCCLUSAL'];
const IMAGE_TYPE_LABELS = {
  FRONT: 'Front',
  LEFT: 'Left',
  RIGHT: 'Right',
  UPPER_OCCLUSAL: 'Upper Occlusal',
  LOWER_OCCLUSAL: 'Lower Occlusal',
};

// Discount tiers
const DISCOUNT_TIERS = [
  { minRate: 0, maxRate: 49.99, discount: 0 },
  { minRate: 50, maxRate: 69.99, discount: 10 },
  { minRate: 70, maxRate: 84.99, discount: 20 },
  { minRate: 85, maxRate: 100, discount: 30 },
];
```

---

## Index Exports

`packages/shared/src/index.ts` re-exports all types and constants:

```typescript
export * from './types/user';
export * from './types/practice';
export * from './types/patient';
export * from './types/scan';
export * from './types/tagging';
export * from './types/messaging';
export * from './constants/tags';
```

## Usage in Apps

```typescript
// In apps/api or apps/web:
import { TAG_SCORES, DETAIL_TAG_OPTIONS, Patient, ScanStatus } from '@orthomonitor/shared';
```

The package is referenced via pnpm workspace protocol in each app's `package.json`.

---

## Tests

**File:** `packages/shared/src/__tests__/tags.test.ts`
**Runner:** Vitest

Tests cover:
- All constant arrays are non-empty
- Discount tier coverage spans 0-100% with no gaps
- Discount percentages are correct per tier
- TAG_LABELS map all TAG_SCORES values
- IMAGE_TYPE_LABELS map all IMAGE_TYPES values
- DETAIL_TAG_OPTIONS are unique strings
- 13 test cases across 5 describe blocks
