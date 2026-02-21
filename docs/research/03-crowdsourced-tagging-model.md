# Crowdsourced Tagging Model — The Core Innovation

## 1. Overview

The clinical tagging engine is the heart of OrthoMonitor's strategy. It serves three purposes simultaneously:

1. **Clinical documentation** for the practice (structured records they don't currently have)
2. **AI training data** for us (expert-labeled images at near-zero marginal cost)
3. **Discount mechanism** that drives engagement (financial incentive to tag)

This creates a virtuous cycle: more tagging → better documentation → cheaper subscription → higher engagement → more training data → better future AI → more value.

---

## 2. Design Principles

- **Speed first:** Tagging a complete scan session must take < 15 seconds. If it's slow, doctors won't do it.
- **Structured data:** Every tag is a predefined attribute, not free text. Ensures consistency across practices and direct usability as ML training labels.
- **Clinically useful:** Tags map to things doctors actually care about. They're documenting clinical observations in a faster, more structured way than they currently do.
- **Progressive detail:** Minimum required tags are quick (3–5 taps). Optional detailed tags available for doctors who want granular documentation.

---

## 3. Tag Categories

### 3.1 Required Tags (Quick Assessment — 3 taps minimum)

| Category | Options | UI Element | Data Value |
|----------|---------|-----------|-----------|
| Overall Tracking | On Track / Minor Concern / Off Track | 3-button toggle (green/yellow/red) | Ordinal: 1–3 |
| Aligner/Appliance Fit | Good Fit / Partial Seat / Poor Fit / N/A | 4-button toggle | Ordinal: 1–3 + null |
| Oral Hygiene | Good / Fair / Poor | 3-button toggle (green/yellow/red) | Ordinal: 1–3 |

### 3.2 Optional Detail Tags (Clinical Documentation)

| Category | Available Tags | UI Element |
|----------|---------------|-----------|
| Tooth Movement | Tracking well, Rotation issue, Intrusion/extrusion, Space not closing, Midline shift | Multi-select chips |
| Appliance Issues | Attachment loss, Bracket debond, Wire issue, Elastic not worn, Retainer damage | Multi-select chips |
| Soft Tissue | Gingival inflammation, Recession, White spot lesion, Ulceration, Swelling | Multi-select chips |
| Patient Compliance | Wear time seems good, Wear time seems low, Scan quality poor, Not following instructions | Multi-select chips |
| Action Taken | Advance aligner, Hold current aligner, Schedule visit, Sent hygiene reminder, No action needed | Multi-select chips |
| Custom Note | Free-text field for anything not covered above | Text input (optional) |

---

## 4. Tagging UI Flow

The tagging interface appears as an overlay panel on the scan review screen:

1. **Doctor reviews scan photos** (full-screen viewer with zoom/compare)
2. **Quick Assessment panel slides in** from the right — 3 required toggles pre-visible. Doctor taps green/yellow/red for each. (~5 seconds, 3 taps)
3. **Optional detail tags** collapsed below. Doctor expands any category and taps relevant chips if desired. (0–15 seconds)
4. **Submit & Next** saves tags and moves to next patient. Or **Submit & Message** to tag and send a patient message.

**Total time per scan: 10–30 seconds** for a typical review.

---

## 5. Discount Incentive Model

### 5.1 Tier Structure

| Tagging Rate | Discount | Effective Price (Pro Tier) | Data Value |
|-------------|---------|--------------------------|-----------|
| < 50% of scans tagged | 0% (base price) | €249/month | Low — insufficient for training |
| 50–69% tagged | 10% discount | €224/month | Moderate — useful supplementary data |
| 70–84% tagged | 20% discount | €199/month | High — reliable training signal |
| 85%+ tagged | 30% discount | €174/month | Maximum — gold-standard labeled data |

### 5.2 Mechanics

- Tagging rate calculated on a **rolling 30-day basis**
- Only **required tags** (3 quick toggles) count toward the rate. Optional detail tags are bonus.
- Discount applied **automatically** on next billing cycle
- Dashboard shows **real-time tagging rate** with progress bar toward next tier
- Monthly email report: "You tagged 87% of scans this month, saving €75. Here's what your tags revealed about your patient population."

### 5.3 Why This Works

**For the practice:**
- Tagging is fast (3 taps), clinically useful (structured records), financially rewarding (up to 30% off)
- Almost no reason not to do it

**For OrthoMonitor:**
- Every tagged scan = labeled training image
- At 85%+ tagging rates across 50 practices → thousands of expert-labeled images/month
- Discount cost (~€75/practice/month) is vastly cheaper than hiring annotation teams (€5–15/image externally)

**For AI quality:**
- Clinical tags from practicing orthodontists reviewing their own patients = higher-quality labels than third-party annotators
- Tags reflect real diagnostic context and clinical judgment

---

## 6. Data Accumulation Projections

| Milestone | Practices | Avg Patients | Scans/Week | Monthly Tagged Images | Cumulative (12 mo) |
|-----------|----------|-------------|-----------|---------------------|-------------------|
| Month 3 | 5 | 40 | 200 | 4,000 | 12,000 |
| Month 6 | 15 | 60 | 900 | 18,000 | 66,000 |
| Month 9 | 30 | 70 | 2,100 | 42,000 | 192,000 |
| Month 12 | 50 | 80 | 4,000 | 80,000 | 420,000 |
| Month 18 | 100 | 90 | 9,000 | 180,000 | 1,500,000+ |

Each scan session = 5 images, each tagged with minimum 3 clinical attributes.

By month 12: **420,000+ labeled images** — a dataset comparable to what DentalMonitoring took years to build, collected at near-zero marginal cost.

---

## 7. Data Schema for Tags

```json
{
  "session_id": "uuid",
  "tagged_by": "doctor_uuid",
  "tagged_at": "2026-08-15T14:30:00Z",
  "required_tags": {
    "overall_tracking": 1,        // 1=on-track, 2=minor-concern, 3=off-track
    "aligner_fit": 2,             // 1=good, 2=partial, 3=poor, null=N/A
    "oral_hygiene": 1             // 1=good, 2=fair, 3=poor
  },
  "detail_tags": {
    "tooth_movement": ["tracking_well"],
    "appliance_issues": [],
    "soft_tissue": ["gingival_inflammation"],
    "compliance": ["wear_time_good"],
    "action_taken": ["advance_aligner"]
  },
  "notes": "",
  "ai_suggested": false,          // Phase 2: was this pre-filled by AI?
  "ai_overridden": false          // Phase 2: did doctor change AI suggestion?
}
```

---

## 8. Quality Assurance

### Inter-Rater Reliability
- Periodically show the same scan to multiple doctors (across different practices) to measure agreement
- Only include a practice's tags in AI training data if their inter-rater reliability exceeds a threshold (e.g., Cohen's kappa > 0.6)
- This ensures training data quality without burdening individual doctors

### Tag Distribution Monitoring
- Track distribution of tags across practices to detect outliers
- A practice that tags 95% of scans as "On Track" may be auto-tagging without reviewing
- Flag for review; exclude from training data if suspicious

### Feedback Loop
- When AI is activated (Phase 2), doctor corrections feed back as high-value training signal
- Active learning: AI specifically requests human review on low-confidence predictions
