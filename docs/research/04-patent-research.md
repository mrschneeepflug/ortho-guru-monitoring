# Patent Research: DentalMonitoring IP Landscape

> **Disclaimer:** This document is research notes, not legal advice. A formal freedom-to-operate (FTO) analysis by a qualified patent attorney is required before shipping any product, especially AI features. Budget €15–25K for this.

---

## 1. DentalMonitoring Patent Portfolio — Scale

DentalMonitoring holds **470+ patents and pending applications** (as of February 2026). This has grown rapidly:

- 2021 (academic literature): 31 patents referenced
- 2022 (lawsuit filings): "over 200 patents"
- 2026 (latest funding round): "more than 470 patents"

DM is clearly investing heavily in IP protection and treats it as a core competitive moat.

---

## 2. DM's Patent Enforcement History

DM has demonstrated willingness to aggressively enforce patents. They have sued:

### Lawsuit 1: DM vs. Get-Grin (May 2022)
- **Court:** US District Court, District of Delaware
- **Patents asserted:** US 10,755,409 and US 11,314,983
- **Claims:** Methods of analyzing an image of a dental arch
- **Grin's response:** "We at Grin have independently developed amazing technology... We are confident in everything we have built."

### Lawsuit 2: DM vs. Get-Grin — ScanBox (April 2023)
- **Court:** US District Court, District of Delaware
- **Patents asserted:** US 11,532,079 and US 11,599,997
- **Claims:** Dental imaging device and methods of using it to acquire dental images
- **This is about the hardware (ScanBox) specifically**

### Lawsuit 3: DM vs. Align Technology / Invisalign (November 2022)
- **Court:** Northern District of California
- **Patents asserted:** US 10,755,409, US 11,049,248, and US 11,109,945
- **Claims:** Align's Virtual Care AI solution infringes DM's remote monitoring patents
- **Status:** Court ruled Align must face the suit (July 2023). Case proceeded. Appeal now at Federal Circuit (case 24-2270 and 25-1752).
- **Notable:** PTAB Inter Partes Review IPR2023-01369 filed — resulted in Final Written Decision. **Must check outcome with patent attorney — could have narrowed/invalidated claims.**

### Key Takeaway
DM sues competitors — both large (Align, $50B+ company) and small (Grin, startup). They will not ignore us if we infringe. Our strategy must be built around avoidance.

---

## 3. Key Patents — Detailed Analysis

### 3.1 US 10,755,409 — "Method for analyzing an image of a dental arch"

**This is DM's most-asserted patent** — used in lawsuits against both Grin and Align Technology.

**Filing date:** July 10, 2018  
**Priority date:** July 21, 2017  
**Granted:** August 25, 2020  
**Expires:** ~September 2038  
**Inventors:** Philippe Salah, Thomas Pellissard, Guillaume Ghyselinck, Laurent Debraux  
**Status:** Active, in litigation

#### What It Claims (Detailed Analysis Method — Claims 1-4)

The patent describes a method for "detailed analysis" of a dental arch image:

1. **Create a learning base** of 1,000+ dental arch images ("historical images"), where each image has identified "tooth zones" with assigned "tooth attribute values" (tooth number, type, condition, shape parameters, etc.)

2. **Train a deep learning device** (neural network) using this learning base

3. **Submit an "analysis image"** to the trained network, which determines probabilities relating to tooth attributes in identified tooth zones

4. **Determine** tooth presence and attribute values based on those probabilities

#### What It Also Claims (Global Analysis Method)

A variant where instead of per-tooth analysis, the network determines "image attributes" for the whole image:
- Whether the dental situation is "pathological" or "not pathological"
- Appliance condition ("degraded" or "in good condition")
- Image quality ("insufficient contrast" / "acceptable contrast")
- Image orientation ("front photo" / "left photo" / "right photo")
- Mouth state ("open" / "closed")

#### What It Also Claims (Aligner Fit Assessment)

A specific method for assessing orthodontic aligner shape:
- Using deep learning trained on images showing separation between teeth and aligners
- Determining whether aligner fit is acceptable or not
- This is the basis of DM's "GoLive" Go/No-Go system

#### What It Also Claims (Learning Base Enrichment)

A method for automatically generating training data:
- Create a 3D reference model from a scan
- Acquire 2D updated images (photos)
- Match the 2D photos to views of the 3D model using metaheuristic optimization
- Transfer tooth zone labels from the 3D model to the 2D photos
- Add labeled photos to the training base

#### What It Also Claims (Image Acquisition Guidance)

Using AI to guide photo acquisition:
- Analyze image in real-time
- Determine if it meets quality/orientation requirements
- Send feedback to guide the patient

#### Critical Details for Design-Around

The patent specifically requires:
- A **proprietary learning base** ("more than 1000 historical images")
- **Training** a deep learning device with that learning base
- The trained device **determining** tooth attribute values or image attribute values
- Specific "tooth zones" identified on images (for detailed analysis)
- Use of "tooth attribute values" (tooth number, type, condition, etc.)

The patent references but does NOT exclusively claim:
- Any specific neural network architecture
- Any specific image capture hardware
- The concept of remote monitoring itself

### 3.2 US 11,049,248 and US 11,109,945

Asserted against Align Technology alongside 10,755,409. Likely continuation patents covering related methods. Need patent attorney to pull full claims.

### 3.3 US 11,314,983

Asserted against Grin alongside 10,755,409. Also covers methods of analyzing dental arch images.

### 3.4 US 11,532,079 — ScanBox Device Patent

**Asserted against Grin in the hardware lawsuit.**

Covers a dental imaging device defined as:
- A "support defining a chamber" with two openings
- First opening positioned in front of patient's mouth
- Second opening where a mobile phone is fixed
- The enclosed chamber design for consistent imaging

### 3.5 US 11,599,997 — ScanBox Methods Patent

Covers methods of using the ScanBox-type device to acquire dental images. Paired with 11,532,079 in the Grin hardware lawsuit.

---

## 4. Risk Assessment by Product Area

### 4.1 Manual Monitoring Platform (v1.0) — LOW RISK ✅

| Feature | Patent Risk | Rationale |
|---------|-----------|-----------|
| Patient takes photos on phone | None | Generic photography, predates DM |
| Photos uploaded to cloud | None | Standard data transfer |
| Doctor reviews photos on dashboard | None | Basic telemedicine/image review |
| Doctor manually tags clinical attributes | None | Human clinical judgment, no AI |
| Secure messaging | None | Generic communication feature |
| Compliance tracking | None | Standard SaaS analytics |
| Practice analytics | None | Standard business intelligence |

**Conclusion:** The manual monitoring tool does not practice any of DM's patent claims. The patents are specifically about AI-powered analysis, not human review of photos.

### 4.2 Imaging Hardware — VARIES BY APPROACH

| Approach | Risk | Rationale |
|----------|------|-----------|
| Plain cheek retractor | None ✅ | Pre-existing dental tool. Patent itself references retractors as known art. |
| Grin-style funnel | Medium ⚠️ | DM sued Grin over hardware patents. Depends on specific design vs. claims. |
| ScanBox-like enclosed chamber | High ❌ | Directly covered by US 11,532,079 |
| No device (AR guidance only) | None ✅ | No hardware = no hardware patents |

**Recommendation:** Plain cheek retractor + AR overlay guidance. Zero patent exposure.

### 4.3 AI-Assisted Analysis (Phase 2) — ELEVATED RISK ⚠️

| Feature | Risk | Rationale |
|---------|------|-----------|
| Custom neural network trained on dental images | High ❌ | Core of US 10,755,409 claims |
| Per-tooth zone segmentation + attribute classification | High ❌ | Specifically claimed in detailed analysis method |
| Aligner fit detection via custom model | High ❌ | Specifically claimed aligner assessment method |
| Image quality validation via AI | Low ✅ | Generic image quality assessment, likely not novel |
| Foundation model API (GPT/Gemini) for clinical assessment | Low-Medium ✅⚠️ | Fundamentally different architecture (see design-around) |
| Temporal change detection between scans | Low ✅ | Different method — comparing images over time, not classifying attributes |
| Anomaly detection / triage scoring | Low ✅ | Pattern matching, not dental attribute determination |

---

## 5. Hardware Design-Around Options

### Option A: Plain Cheek Retractor (RECOMMENDED)

Standard C-shaped dental cheek retractor. Patient holds in mouth, takes photos with phone.

**Pros:**
- Zero patent risk
- Cost: €1–3 per unit
- Widely available, many suppliers
- Patients can buy replacements easily

**Cons:**
- Less consistent image framing than ScanBox
- Patient needs both hands (retractor + phone) or selfie timer
- More variation in angle and lighting

**Mitigation:** On-device quality validation rejects poor images. AR overlay guides positioning.

### Option B: Grin-Style Funnel

Smaller, open-ended funnel that helps position the phone camera relative to the mouth. Not an enclosed box.

**Key design differences from ScanBox:**
- **No enclosed chamber** — open-ended funnel, light enters from sides
- **No phone-fixing mechanism** — patient holds phone freely against the wide end
- **Single opening** (mouth end), not dual-opening chamber
- **No registration marks** for trigonometric position calculation

**Pros:**
- Better consistency than bare retractor
- Still relatively cheap (€5–15 per unit)
- Different physical design from ScanBox

**Cons:**
- DM sued Grin specifically over their device design
- Risk level depends on exact claim interpretation
- Needs patent attorney review before proceeding

**Status:** Grin has not publicly abandoned their device design, suggesting they believe their defense has merit. But the lawsuit outcome is not publicly resolved.

### Option C: Pure Software Guidance — No Device (RECOMMENDED AS V1.5)

Use on-screen AR overlays to guide positioning:
- Show tooth silhouette overlay on camera preview
- Guide patient: "Move phone closer," "Tilt left," "Hold steady"
- Auto-capture when alignment and quality criteria are met
- Video mode as alternative: patient records a sweep, best frames auto-extracted

**Pros:**
- Zero hardware cost
- Zero patent risk (no device)
- No supply chain, no inventory
- Works immediately with any phone

**Cons:**
- Less consistent than any physical device
- Requires good on-device processing
- Learning curve for patients

### Recommended Path

**MVP (Month 1–6):** Plain cheek retractor + basic in-app capture guidance  
**V1.5 (Month 6–9):** Add AR overlay guidance for better consistency  
**V2.0+ (If needed):** Evaluate custom funnel design with patent attorney clearance

---

## 6. PTAB Inter Partes Review — IPR2023-01369

This is potentially very important. The US Patent Trial and Appeal Board (PTAB) conducted an inter partes review of patent 10,755,409, which resulted in a "Final Written Decision."

**This could mean:**
- Some or all claims were found invalid (great for us)
- Claims were upheld (bad for design-around flexibility)
- Claims were narrowed (potentially useful)

**Action required:** Patent attorney must retrieve and analyze the Final Written Decision from PTAB. This could fundamentally change the risk landscape.

---

## 7. Geographic Considerations

All of DM's patent enforcement has been in **US federal courts**. European patent law is different:

- European patents are generally interpreted more narrowly
- Enforcement is per-country, not pan-European
- Software patents face higher scrutiny in Europe
- If we launch primarily in Europe, near-term US patent risk is lower

**However:** DM is a French company. They likely have European patents as well. EU patent search is needed separately.

**Recommendation:** Launch in Europe first (aligns with GDPR focus and our market). Get both US and EU patent searches done.

---

## 8. Action Items

| Priority | Action | Budget | Timeline |
|----------|--------|--------|----------|
| 1 | Retrieve PTAB IPR2023-01369 Final Written Decision | €0 (public record) | Immediate |
| 2 | Engage patent attorney for FTO analysis | €15–25K | Month 1–2 |
| 3 | EU patent search for DM's European filings | €3–5K | Month 2 |
| 4 | Monitor Align v. DM Federal Circuit appeal outcome | €0 | Ongoing |
| 5 | Design-around architecture review with patent counsel | Included in FTO | Month 3 |
