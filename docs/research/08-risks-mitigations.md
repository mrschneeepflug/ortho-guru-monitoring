# Risks & Mitigations

## Risk Matrix

| # | Risk | Impact | Likelihood | Priority |
|---|------|--------|-----------|----------|
| 1 | Patent infringement claim from DentalMonitoring | Critical | Medium | 🔴 Highest |
| 2 | Doctors don't tag consistently | High | Medium | 🟠 High |
| 3 | Low patient scan compliance | Medium | Medium | 🟡 Medium |
| 4 | HIPAA / GDPR data breach | Critical | Low | 🟠 High |
| 5 | DentalMonitoring launches a cheap tier | High | Low–Medium | 🟡 Medium |
| 6 | AI data quality from tags is insufficient | Medium | Medium | 🟡 Medium |
| 7 | Slow practice acquisition | Medium | Medium | 🟡 Medium |
| 8 | Regulatory risk when AI launches | High | Medium | 🟠 High |
| 9 | Technical debt from rushing MVP | Medium | Medium | 🟡 Medium |
| 10 | Key person dependency | High | Medium | 🟠 High |

---

## Detailed Analysis

### 1. Patent Infringement Claim from DentalMonitoring

**Impact:** Critical — lawsuit costs, injunction risk, potential shutdown of AI features  
**Likelihood:** Medium — DM has sued both Grin and Align; they enforce aggressively

**Mitigations:**
- Manual-first v1.0 avoids AI patent claims entirely
- Foundation model approach for AI (no custom training) is architecturally distinct
- Doctor-in-the-loop: AI suggests, doctor determines
- No ScanBox-like hardware — generic cheek retractors only
- Formal FTO analysis by patent attorney before shipping AI features (€15–25K)
- Monitor PTAB IPR2023-01369 outcome and Align v. DM Federal Circuit appeal
- Launch in Europe first where patent enforcement landscape differs
- Build relationship with patent litigation counsel early

**See:** [Patent Research](./04-patent-research.md), [AI Design-Around](./05-ai-roadmap-design-around.md)

---

### 2. Doctors Don't Tag Consistently

**Impact:** High — breaks the data flywheel, undermines AI roadmap  
**Likelihood:** Medium — tagging adds friction to review workflow

**Mitigations:**
- Make tagging ultra-fast (3 taps, < 15 seconds per scan)
- Strong discount incentive (up to 30% off monthly fee)
- Real-time tagging rate displayed in dashboard
- Monthly reports showing value of tags for clinical documentation
- Gamification elements (streaks, milestones)
- Default to "most common" tags to reduce cognitive load
- Show practice-level analytics derived from their tags ("You identified 23 hygiene concerns this month")

---

### 3. Low Patient Scan Compliance

**Impact:** Medium — if patients don't scan, the platform has no value  
**Likelihood:** Medium — home-based compliance is always challenging

**Mitigations:**
- Make scanning < 90 seconds (guided workflow, clear instructions)
- Push notification reminders with customizable frequency
- Compliance streak tracker with encouragement
- Practice staff tools for follow-up (automated nudge after 2 missed scans)
- Educational onboarding: show patients how easy scanning is
- Progress timeline in app motivates regular scanning
- Consider: small incentives (e.g., "complete 8 consecutive scans and enter a draw")

---

### 4. HIPAA / GDPR Data Breach

**Impact:** Critical — legal liability, fines (up to 4% revenue under GDPR), reputation destruction  
**Likelihood:** Low — strong technical controls reduce probability

**Mitigations:**
- Encryption everywhere (at rest + in transit)
- RBAC with mandatory MFA for staff accounts
- Audit logging of all PHI access
- Annual penetration testing
- Incident response plan with 72-hour breach notification
- Cyber insurance policy
- Employee training on data handling
- Practice-level data isolation
- Regular security audits

---

### 5. DentalMonitoring Launches a Cheap Tier

**Impact:** High — erodes our price advantage  
**Likelihood:** Low–Medium — structurally difficult for DM but not impossible

**Mitigations:**
- DM's enterprise model makes downmarket moves painful (cannibalizes existing revenue)
- Our brand already positioned for smaller practices before any DM response
- Speed of execution matters — establish customer base before they react
- Build switching costs: clinical documentation history, tagging data, workflow habits
- Community building: become the "practice of independent orthodontists" platform
- Even if DM offers cheaper options, their minimum commitments and complexity remain barriers

---

### 6. AI Data Quality from Tags is Insufficient

**Impact:** Medium — delays or limits AI capabilities  
**Likelihood:** Medium — crowdsourced labels have inherent variability

**Mitigations:**
- Inter-rater reliability analysis across practices
- Minimum consistency threshold before including practice's tags in training data
- Optional detail tags provide richer signal for edge cases
- Tag distribution monitoring to detect gaming or auto-tagging
- Foundation model approach (Strategy 1) doesn't depend on our training data at all
- Quality > quantity: even imperfect labels provide useful signal for basic classifications

---

### 7. Slow Practice Acquisition

**Impact:** Medium — delays revenue, extends burn rate  
**Likelihood:** Medium — B2B sales in healthcare is always slow

**Mitigations:**
- Start with founder's network (near-zero CAC for first 10–20 practices)
- Founding member pricing (50% off) creates urgency
- Build compelling case studies from internal pilot
- Conference presence for visibility
- Referral program: 1 free month per referred practice
- Self-serve signup reduces sales friction
- Free trial or money-back guarantee to reduce risk perception

---

### 8. Regulatory Risk When AI Launches

**Impact:** High — could require FDA clearance, delaying AI features by 12–24 months  
**Likelihood:** Medium — depends on how AI is positioned (CDS vs. SaMD)

**Mitigations:**
- Position AI as "informational" / Clinical Decision Support
- Doctor always confirms AI suggestions (never autonomous)
- Engage regulatory counsel at month 6 for early assessment
- Implement ISO 13485-compliant QMS by month 12 as precaution
- Use DentalMonitoring's De Novo as predicate device if FDA path needed
- Phase AI features gradually — start with lowest-risk (image quality) before clinical

---

### 9. Technical Debt from Rushing MVP

**Impact:** Medium — slows future development, increases bug rate  
**Likelihood:** Medium — typical startup pressure to ship fast

**Mitigations:**
- Clean modular architecture from day one (NestJS modules)
- Code reviews for all PRs
- Test coverage target > 70%
- Refactoring sprints every 3rd sprint
- TypeScript end-to-end for type safety
- Linting and formatting enforced (ESLint, Prettier)
- Clear separation of concerns in database schema
- Infrastructure as code (Terraform) from the start

---

### 10. Key Person Dependency

**Impact:** High — if CTO or founder leaves/becomes unavailable  
**Likelihood:** Medium — small team, high individual impact

**Mitigations:**
- Document all architectural decisions and configurations
- Shared password management (1Password / LastPass)
- At least 2 people with access to all critical systems
- Regular knowledge sharing sessions
- Equity / vesting to retain key hires
- Standard development practices so new developers can onboard quickly

---

## Risk Monitoring

| Metric | Threshold | Response |
|--------|-----------|----------|
| Tagging rate across all practices | Falls below 60% | Investigate UX friction, increase discount, add nudges |
| Patient scan compliance | Falls below 65% | Review notification strategy, simplify scanning workflow |
| Monthly churn | Exceeds 6% | Customer interviews, feature gap analysis |
| Security incidents | Any | Activate incident response plan immediately |
| Patent-related legal activity from DM | Any targeting competitors | Alert patent counsel, review our exposure |
| AI model agreement with doctors | Below 70% | Adjust prompts, evaluate alternative models, consider custom training |
