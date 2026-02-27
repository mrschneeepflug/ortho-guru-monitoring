# AI Tagging System

## Business Context

OrthoMonitor follows a **manual-first strategy**: doctors always have final authority over scan assessments. The AI provides suggestions to speed up the review process, but doctors can accept, modify, or ignore all AI-generated values. The system tracks whether AI was used (`aiSuggested`) and whether the doctor changed the values (`aiOverridden`).

---

## Tag Taxonomy

### Primary Scores (1-3 Scale)

| Category | Score 1 | Score 2 | Score 3 |
|----------|---------|---------|---------|
| **Overall Tracking** | Good | Fair | Poor |
| **Aligner Fit** | Good | Fair | Poor |
| **Oral Hygiene** | Good | Fair | Poor |

- `overallTracking` and `oralHygiene` are **required**
- `alignerFit` is **optional** (null for non-aligner patients)

### Detail Tags

12 clinical detail tags that can be applied as multi-select:

| Tag | Category |
|-----|----------|
| Attachment missing | Appliance issues |
| Aligner not seating | Appliance issues |
| Spacing issue | Alignment |
| Crowding | Alignment |
| Open bite | Bite issues |
| Crossbite | Bite issues |
| Gingival inflammation | Oral health |
| Plaque buildup | Oral health |
| Decalcification | Oral health |
| Elastic wear compliance | Patient compliance |
| IPR needed | Treatment planning |
| Refinement needed | Treatment planning |

These are defined in `packages/shared/src/constants/tags.ts` as `DETAIL_TAG_OPTIONS`.

### Action Taken
Free-text field for the action recommended (e.g., "Continue current stage", "Schedule office visit", "Rescan in 1 week").

### Notes
Free-text clinical notes.

---

## Discount Tiers

Practices earn discounts based on their 30-day tagging rate (percentage of scan sessions that have been tagged):

| Tagging Rate | Discount |
|-------------|----------|
| < 50% | 0% |
| 50% - 69.99% | 10% |
| 70% - 84.99% | 20% |
| 85% - 100% | 30% |

Defined in `packages/shared/src/constants/tags.ts` as `DISCOUNT_TIERS`.

**Calculation:** `taggingRate = (taggedSessions / totalSessions) * 100` over the last 30 days.

Analytics are computed by `TaggingAnalyticsService.getAnalytics()` and persisted to the `Practice` record (`taggingRate` and `discountPercent` fields).

---

## AI Suggestion Flow

```
Doctor clicks "Get AI Suggestion"
  │
  ▼
Frontend: POST /tagging/sessions/{sessionId}/suggest
  │
  ▼
TaggingService.suggestTags(sessionId, practiceId)
  │
  ├── Load ScanSession with images
  ├── For each image with s3Key:
  │     └── StorageService.getObject(key) → Buffer
  ├── Determine media type from key extension
  │
  ▼
AiService.analyzeScanImages(images)
  │
  ├── Convert each buffer to base64
  ├── Build Claude API request with:
  │     ├── System prompt (orthodontic evaluation)
  │     ├── Image content blocks
  │     └── JSON response format
  ├── Send to Claude Sonnet 4 (claude-sonnet-4-20250514)
  │
  ▼
Parse JSON response
  │
  ├── validateSuggestion()
  │     ├── Clamp scores to 1-3
  │     ├── Filter detailTags against DETAIL_TAG_OPTIONS
  │     └── Ensure confidence 0-1
  │
  ▼
Return AiTagSuggestion to frontend
  │
  ▼
Frontend populates TaggingPanel form fields
  │
  ├── Doctor reviews/modifies values
  ├── If any value changed → aiOverridden = true
  │
  ▼
Doctor submits → POST /tagging/sessions/{sessionId}/tags
  with aiSuggested: true, aiOverridden: true/false
```

---

## AiService

**File:** `apps/api/src/common/ai/ai.service.ts`

### Configuration
- **API Key:** `ANTHROPIC_API_KEY` env var
- **Model:** `claude-sonnet-4-20250514`
- **SDK:** `@anthropic-ai/sdk`
- When API key is not set, `isEnabled()` returns false and suggestions are unavailable

### analyzeScanImages Method

**Input:** Array of `{ mediaType: string, buffer: Buffer }`
**Output:** `AiTagSuggestion`

```typescript
interface AiTagSuggestion {
  overallTracking: number;  // 1-3
  alignerFit: number;       // 1-3
  oralHygiene: number;      // 1-3
  detailTags: string[];     // From DETAIL_TAG_OPTIONS
  actionTaken: string | null;
  notes: string | null;
  confidence: number;       // 0-1
}
```

### System Prompt
The AI is instructed to:
- Analyze dental scan images for orthodontic treatment monitoring
- Evaluate tracking (teeth moving as planned), aligner fit (seated well, gaps), and oral hygiene (plaque, gingivitis)
- Score conservatively when uncertain (prefer lower scores)
- Only include detail tags that are clearly visible in the images
- Return a confidence score (0-1)

### Validation
After receiving the AI response:
1. Numeric scores are clamped to valid range (1-3)
2. Detail tags are filtered against `DETAIL_TAG_OPTIONS` (invalid tags removed)
3. Confidence is clamped to 0-1
4. Missing fields get safe defaults

---

## Frontend: TaggingPanel

**File:** `apps/web/src/components/scans/tagging-panel.tsx`

### UI Structure
1. **Score toggles:** Three rows of 1-2-3 buttons for Overall Tracking, Aligner Fit, Oral Hygiene
2. **Detail tags:** Multi-select button chips from `DETAIL_TAG_OPTIONS`
3. **Action taken:** Text input
4. **Notes:** Textarea
5. **"Get AI Suggestion" button:** Triggers `POST /tagging/sessions/{sessionId}/suggest`
6. **Submit/Update button:** Saves tag set

### AI Integration Behavior
- When AI suggestion returns, all form fields are populated
- `aiSuggested` flag is set to `true`
- If the doctor changes ANY value from the AI suggestion, `aiOverridden` is set to `true`
- Both flags are submitted with the tag set for analytics

### State Tracking
The component tracks:
- Current form values (scores, tags, notes, action)
- Whether AI was used (`aiSuggested`)
- Original AI values (for override detection)
- Whether values differ from AI suggestion (`aiOverridden`)

---

## Constants Reference

**File:** `packages/shared/src/constants/tags.ts`

```typescript
TAG_SCORES = { GOOD: 1, FAIR: 2, POOR: 3 }
TAG_LABELS = { 1: 'Good', 2: 'Fair', 3: 'Poor' }
TAG_CATEGORIES = {
  OVERALL_TRACKING: 'overallTracking',
  ALIGNER_FIT: 'alignerFit',
  ORAL_HYGIENE: 'oralHygiene',
}
IMAGE_TYPES = ['FRONT', 'LEFT', 'RIGHT', 'UPPER_OCCLUSAL', 'LOWER_OCCLUSAL']
IMAGE_TYPE_LABELS = {
  FRONT: 'Front',
  LEFT: 'Left',
  RIGHT: 'Right',
  UPPER_OCCLUSAL: 'Upper Occlusal',
  LOWER_OCCLUSAL: 'Lower Occlusal',
}
```

---

## Database: TagSet Model

| Field | Type | Description |
|-------|------|-------------|
| `overallTracking` | Int (1-3) | Required |
| `alignerFit` | Int? (1-3) | Optional |
| `oralHygiene` | Int (1-3) | Required |
| `detailTags` | Json (string[]) | Default: [] |
| `actionTaken` | String? | Free text |
| `notes` | String? | Free text |
| `aiSuggested` | Boolean | Default: false |
| `aiOverridden` | Boolean | Default: false |
| `sessionId` | String (unique) | One TagSet per ScanSession |
| `taggedById` | String | FK → Doctor |
