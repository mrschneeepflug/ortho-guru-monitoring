# AI Roadmap & Patent Design-Around Strategies

## 1. The Problem

DentalMonitoring's core patent (US 10,755,409) broadly covers: "use a neural network trained on labeled dental images to analyze a new dental photo and determine clinical attributes." This covers a significant portion of the obvious AI dental analysis approach.

We need AI features to remain competitive long-term, but we need to implement them in ways that avoid practicing DM's patent claims.

This document outlines five design-around strategies, ranked by feasibility and risk.

---

## 2. Strategy 1: Foundation Model API (PRIMARY RECOMMENDATION)

### Concept

Instead of training a custom neural network on a proprietary dental image dataset (which is exactly what the patent describes), use a pre-trained general-purpose vision model (GPT-4o, Gemini, Claude) via API.

### How It Differs From the Patent

| Patent Requirement | Our Approach | Different? |
|-------------------|-------------|-----------|
| Create a learning base of 1,000+ dental images | We create NO learning base | ✅ Yes |
| Assign tooth attribute values to historical images | We label NO training images | ✅ Yes |
| Train a deep learning device with the learning base | We train NO model | ✅ Yes |
| Submit analysis image to trained device | We send image to third-party API with a text prompt | ✅ Architecturally different |
| Device determines tooth attribute probabilities | Model responds to natural language query | ⚠️ Functionally similar output |

### Implementation

```
Patient submits scan
       │
       ▼
Images sent to GPT-4o/Gemini API with structured prompt:
"Analyze this orthodontic scan photo. Assess:
 1. Aligner fit (good/partial/poor)
 2. Oral hygiene (good/fair/poor)
 3. Overall tracking (on-track/concern/off-track)
 Respond in JSON format only."
       │
       ▼
API response pre-fills doctor's tagging panel
       │
       ▼
Doctor confirms or corrects with single tap
       │
       ▼
Final tags saved (doctor's decision, not AI's)
```

### Current Capability Assessment

**GPT-4o (as of early 2026):**
- Can qualitatively assess dental photos
- Provides reasonable assessments of aligner fit, hygiene status
- Not clinically validated
- Improving rapidly with each model version

**Gemini 2.0 Pro:**
- Similar vision capabilities
- Google's medical AI investments (Med-PaLM) may give dental advantage
- Multimodal native

**Projected capability by Phase 2 (late 2026/early 2027):**
- Significantly improved medical image understanding
- Likely near-specialist-level for straightforward visual assessments
- Multiple competing models to choose from
- Costs will continue to drop

### Advantages

- **No training data needed** — eliminates biggest bottleneck
- **No training infrastructure** — no SageMaker, no GPU costs
- **Architecturally distinct** from patent — strong design-around argument
- **Always improving** — model upgrades are free/automatic
- **Fast to implement** — API integration, not ML engineering
- **Multi-vendor** — can switch between GPT/Gemini/Claude for best performance

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| DM argues foundation model was "trained on dental images" | We didn't train it, didn't create the training data, don't control the model. This is like arguing that a doctor "trained on dental images" — they did, but DM can't patent a doctor's analysis. |
| Accuracy insufficient for clinical use | Position as "suggested" tags, not diagnostic output. Doctor always confirms. |
| API costs at scale | At $0.01–0.03 per image, 80,000 images/month = $800–2,400/month. Manageable. |
| Latency | Batch processing during off-peak. Pre-fill tags before doctor opens the review. |
| Data privacy (sending patient images to third party) | Use API with BAA (OpenAI and Google both offer HIPAA-compliant API tiers). De-identify metadata before sending. |
| Model hallucination / incorrect assessment | Doctor-in-the-loop. AI is a suggestion, not a decision. Every tag reviewed by human. |

### Cost Projection

| Scale | Images/Month | API Cost/Month | Cost/Practice |
|-------|-------------|---------------|--------------|
| 50 practices | 80,000 | $800–2,400 | $16–48 |
| 100 practices | 180,000 | $1,800–5,400 | $18–54 |
| 250 practices | 500,000 | $5,000–15,000 | $20–60 |

Easily covered by AI tier pricing premium (€50–100/month per practice).

---

## 3. Strategy 2: Whole-Image Classification Only (No Tooth Segmentation)

### Concept

If a custom model is needed (fallback), build it to classify the entire image rather than identifying individual tooth zones and per-tooth attributes.

### How It Differs From the Patent

The patent's "detailed analysis" specifically requires:
1. Identifying "tooth zones" on the image
2. Assigning "tooth attribute values" to each zone
3. Using trained neural network to determine per-tooth probabilities

Our approach:
1. Classify the whole image with 3 labels (matching our tag categories)
2. No tooth segmentation, no per-tooth analysis
3. Output is global assessment, not per-tooth attributes

This maps more closely to the patent's "global analysis" claims, which are broader but also more common in prior art (whole-image medical classification is well-established).

### Implementation

```python
# Model architecture: Whole-image classification only
# Input: 5 intraoral photos
# Output: 3 classifications (no tooth-level segmentation)

class OrthoClassifier(nn.Module):
    def __init__(self):
        self.backbone = EfficientNet_B4(pretrained=True)
        # Whole-image heads only — NO spatial/tooth-zone analysis
        self.tracking_head = nn.Linear(1792, 3)   # on-track/concern/off-track
        self.fit_head = nn.Linear(1792, 3)        # good/partial/poor
        self.hygiene_head = nn.Linear(1792, 3)    # good/fair/poor

    def forward(self, x):
        features = self.backbone(x)  # Global average pooling → single vector
        # No segmentation, no tooth zone detection, no spatial analysis
        return {
            'tracking': self.tracking_head(features),
            'fit': self.fit_head(features),
            'hygiene': self.hygiene_head(features)
        }
```

### Risk Level: Medium ⚠️

The "global analysis" variant in the patent still describes training a model on labeled dental images. The architecture is different (no tooth zones), but the overall pattern (train on dental images → classify dental image) is similar.

---

## 4. Strategy 3: Temporal Change Detection

### Concept

Instead of analyzing a single image to determine clinical attributes, compare sequential images of the same patient over time to detect **change** rather than **state**.

### How It Differs From the Patent

The patent focuses on analyzing a single "analysis image" to determine attributes. Change detection between time-series images is a fundamentally different method:

- "This area looks different from 2 weeks ago" (change detection)
- vs. "This tooth has attribute value X" (attribute classification — patented)

### Implementation

```python
# Compare current scan to previous scan(s)
# Output: change score, not clinical classification

class ChangeDetector(nn.Module):
    def __init__(self):
        self.encoder = EfficientNet_B4(pretrained=True)

    def forward(self, current_image, previous_image):
        feat_current = self.encoder(current_image)
        feat_previous = self.encoder(previous_image)

        # Compute difference features
        diff = feat_current - feat_previous
        change_score = self.change_head(diff)  # 0-1 scale

        return {
            'change_magnitude': change_score,
            'regions_changed': self.heatmap_head(diff)  # visual diff map
        }
```

### User-Facing Output

- "Significant visual change detected since last scan — doctor review recommended"
- Heat map overlay showing areas of change
- No clinical interpretation — just visual difference flagging

### Risk Level: Low ✅

Change detection / anomaly detection in image series is well-established prior art that predates DM's patents. The method is fundamentally different — we're measuring similarity between images, not classifying dental attributes.

---

## 5. Strategy 4: Anomaly Detection / Triage Scoring

### Concept

Instead of classifying dental attributes, score scans based on how "unusual" they look compared to the patient's own baseline. Flag outliers for priority doctor review.

### How It Differs From the Patent

- No dental attribute determination
- No tooth zone identification
- No clinical classification
- Pure statistical outlier detection: "this scan looks different from this patient's norm"

### Implementation

- Build an embedding model that converts each scan to a feature vector
- For each patient, maintain a rolling baseline of their feature vectors
- When new scan arrives, compute distance from baseline
- High distance = flagged for priority review

### Risk Level: Low ✅

This is generic anomaly detection, not dental image analysis as described in the patent.

---

## 6. Strategy 5: Doctor-in-the-Loop (Current Model, Extended)

### Concept

AI provides suggestions, but the **doctor** is always the entity that "determines" attribute values. The AI is an input method, not a decision-maker.

### How It Differs From the Patent

The patent describes the deep learning device as the entity that determines attribute values. In our model:
- AI pre-fills suggested tags
- Doctor reviews and confirms/corrects
- The output is the doctor's determination, not the AI's
- Every single tag has a human approval step

### Legal Argument

"Our AI is a workflow acceleration tool, similar to autocomplete in a text editor. It suggests; the doctor decides. The doctor is the entity that determines the clinical attribute values, using the AI suggestion as one of several inputs alongside their own visual assessment of the images."

### Risk Level: Low-Medium ✅⚠️

Strong position but could be challenged. DM might argue the AI is still "determining" probabilities even if the doctor confirms. Combined with Strategy 1 (foundation model), this creates a layered defense.

---

## 7. Recommended Combined Approach

Layer multiple strategies for strongest patent position:

```
┌─────────────────────────────────────────┐
│          LAYER 1: Foundation Model       │
│  Use GPT-4o/Gemini API, not custom NN   │
│  → No training, no learning base        │
├─────────────────────────────────────────┤
│          LAYER 2: Whole-Image Only       │
│  3 global classifications, no tooth     │
│  zones, no per-tooth attributes         │
├─────────────────────────────────────────┤
│          LAYER 3: Doctor-in-the-Loop     │
│  AI suggests, doctor determines         │
│  Every tag requires human confirmation  │
├─────────────────────────────────────────┤
│          LAYER 4: Temporal Focus         │
│  Emphasize change-over-time, not        │
│  single-image state classification      │
└─────────────────────────────────────────┘
```

Any single layer provides some protection. All four together create a strong design-around position that is architecturally and functionally distinct from DM's patent claims.

---

## 8. AI Development Phases

### Phase 2a: Image Quality AI (Month 6–9)
- Automated scan quality scoring (blur, lighting, framing)
- Real-time rejection of unusable images
- Low patent risk — generic image quality assessment
- Can be trained on non-clinical data (quality vs. poor quality)

### Phase 2b: Foundation Model Integration (Month 9–15)
- GPT-4o/Gemini API for clinical tag suggestions
- Pre-fills doctor's tagging panel
- Doctor confirms/corrects every suggestion
- No custom model training

### Phase 2c: Change Detection (Month 12–18)
- Temporal comparison between patient's scans
- Flag significant visual changes for priority review
- Heat map visualization of changed areas

### Phase 2d: Custom Models (Month 18–24, only if needed)
- Only if foundation models prove insufficient
- Whole-image classification only
- FTO analysis completed before any training begins
- Design reviewed by patent counsel

---

## 9. Performance Targets

| Detection Task | Method | Target | Min Data |
|---------------|--------|--------|---------|
| Image quality validation | Custom lightweight CNN | 95%+ accuracy | 10,000 images |
| Aligner fit suggestion | Foundation model API | 80%+ agreement with doctor | N/A (no training) |
| Oral hygiene suggestion | Foundation model API | 75%+ agreement with doctor | N/A |
| Overall tracking suggestion | Foundation model API | 75%+ agreement with doctor | N/A |
| Significant change detection | Temporal comparison | 90%+ recall on flagged cases | 5,000 paired scans |

---

## 10. Foundation Model Evaluation Plan

Before committing to a specific API provider, run a structured evaluation:

1. **Collect 500 tagged scans** from internal pilot (doctor-tagged ground truth)
2. **Send same images** to GPT-4o, Gemini, and Claude with identical prompts
3. **Measure agreement** between each model's output and doctor tags
4. **Select provider** with highest agreement rate and best HIPAA/BAA support
5. **Re-evaluate quarterly** as models improve

### Prompt Engineering

The prompt is critical for foundation model performance. Example:

```
You are assisting an orthodontist with remote patient monitoring.
Analyze the following intraoral photo of a patient wearing clear aligners.

Assess ONLY these three attributes:
1. ALIGNER_FIT: How well does the aligner sit on the teeth?
   - GOOD: Aligner appears fully seated with minimal gaps
   - PARTIAL: Some areas show gaps or the aligner isn't fully engaged
   - POOR: Significant gaps visible, aligner appears unseated

2. ORAL_HYGIENE: What is the visible oral hygiene status?
   - GOOD: Teeth and gums appear clean, no visible plaque or inflammation
   - FAIR: Some plaque visible or mild gingival redness
   - POOR: Significant plaque, inflammation, or hygiene concerns visible

3. OVERALL_TRACKING: Is the orthodontic treatment appearing to progress normally?
   - ON_TRACK: Teeth appear to be moving as expected
   - MINOR_CONCERN: Some teeth may not be tracking ideally
   - OFF_TRACK: Significant tracking issues visible

Respond in JSON only, no explanation:
{"aligner_fit": "GOOD|PARTIAL|POOR", "oral_hygiene": "GOOD|FAIR|POOR", "overall_tracking": "ON_TRACK|MINOR_CONCERN|OFF_TRACK", "confidence": 0.0-1.0}
```
