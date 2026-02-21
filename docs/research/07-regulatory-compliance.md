# Regulatory & Compliance

## 1. HIPAA Compliance

All architectural decisions assume HIPAA compliance as a baseline requirement for the US market.

### Technical Safeguards

| Safeguard | Implementation |
|-----------|---------------|
| Encryption at Rest | AES-256 for databases (RDS), S3 (SSE-KMS with customer-managed keys), backups |
| Encryption in Transit | TLS 1.3 for all API communication. Certificate pinning in mobile app. |
| Access Control | RBAC via Auth0 (doctor, staff, patient, admin roles). MFA mandatory for doctor/staff. |
| Audit Logging | Every PHI access logged to immutable audit table. Logs retained 6+ years. |
| Session Management | 15-min inactivity timeout (web). Biometric re-auth after backgrounding (mobile). |
| Data Isolation | Practice-level isolation. No cross-practice data access. |
| Backup | Automated daily backups. Point-in-time recovery. Encrypted backup storage. |

### Administrative Safeguards

- Business Associate Agreements (BAAs) with: AWS, Auth0, Twilio, SendGrid
- Annual HIPAA risk assessment and penetration testing
- Incident response plan with 72-hour breach notification procedure
- Employee HIPAA training and background checks
- Designated Privacy Officer and Security Officer

### Required BAAs

| Vendor | Service | BAA Available |
|--------|---------|--------------|
| AWS | Infrastructure | ✅ Yes |
| Auth0 | Authentication | ✅ Yes |
| Twilio | SMS notifications | ✅ Yes |
| SendGrid | Email | ✅ Yes |
| OpenAI (Phase 2) | AI API | ✅ Yes (Enterprise tier) |
| Google Cloud (Phase 2) | AI API | ✅ Yes |

---

## 2. GDPR Compliance

Primary target market is Europe, making GDPR equally critical.

### Requirements & Implementation

| Requirement | Implementation |
|-------------|---------------|
| Lawful Basis | Explicit consent for data processing. Separate consent for AI training data. |
| Right to Erasure | Complete data deletion workflow. Patient request → verified → all data purged within 30 days. |
| Right to Portability | Patient data export in machine-readable format (JSON/PDF). |
| Data Processing Agreements | DPAs with all sub-processors (AWS, Auth0, etc.). |
| EU Data Residency | AWS Frankfurt (eu-central-1) as primary region for European customers. |
| Privacy by Design | Data minimization. Purpose limitation. Storage limitation. |
| Cookie Consent | Compliant consent banner on web properties. |
| Data Protection Officer | Appointed DPO (can be external consultant initially). |
| Records of Processing | Maintained and updated register of processing activities. |

---

## 3. AI Training Data & Patient Consent

Using patient scan data for future AI model training requires careful handling:

### Consent Flow

1. **Service consent** (required): "I consent to OrthoMonitor processing my dental scan images for remote monitoring by my orthodontist."

2. **AI training consent** (separate, opt-in): "I consent to my anonymized dental images being used to improve OrthoMonitor's technology. My images will be stripped of all identifying information before any such use."

3. **Opt-out mechanism**: Patients and practices can opt out at any time. Their data is excluded from future training runs.

### De-identification Process

- All training data stripped of: patient name, DOB, practice info, location
- Images assigned random UUIDs
- EXIF data removed
- No linking back to individual patients possible
- Compliant with HIPAA de-identification (Safe Harbor method)

### Practice Agreement

- Terms of service explicitly state that clinical tags may be used (in de-identified form) for platform improvement
- This is disclosed at practice onboarding and accepted in service agreement

---

## 4. FDA / Medical Device Considerations

### V1.0 (Manual Monitoring) — NOT a Medical Device

The manual monitoring tool is positioned as a **communication and documentation platform**. The doctor makes all clinical decisions. This positions it outside SaMD (Software as a Medical Device) classification.

**Key positioning:**
- We display images; we don't interpret them
- We facilitate communication; we don't diagnose
- We structure documentation; we don't recommend treatment
- The doctor is the decision-maker in every workflow

### V2.0 (AI Features) — Regulatory Strategy Depends on Positioning

| AI Positioning | Regulatory Classification | Path |
|---------------|-------------------------|------|
| "Informational" suggestions that doctor confirms | Clinical Decision Support (CDS) — potentially exempt from FDA | Lower risk, preferred for initial launch |
| AI makes autonomous recommendations | Software as Medical Device (SaMD) — requires FDA clearance | Higher risk, future consideration |

### Preferred Path: CDS Exemption

Under FDA's 2022 final guidance on Clinical Decision Support, software MAY be exempt if it:
1. Is not intended to acquire, process, or analyze a medical image
2. Displays information enabling the HCP to independently review the basis for recommendations
3. Is intended for the purpose of enabling the HCP to independently review the basis
4. Is NOT intended to replace or supplement clinical judgment

**Our AI as CDS:**
- AI "suggests" tag values based on visual analysis
- Doctor sees the actual images and the AI suggestion side by side
- Doctor independently reviews images and confirms/overrides
- Final clinical decision is always the doctor's

**Caveat:** This interpretation should be validated with regulatory counsel. DentalMonitoring's FDA De Novo approval suggests that at some threshold, this type of software becomes SaMD.

### Timeline

| Action | When |
|--------|------|
| Engage regulatory counsel for initial assessment | Month 6 |
| Determine CDS vs. SaMD classification for planned AI features | Month 8 |
| If SaMD: begin ISO 13485 QMS implementation | Month 10 |
| If SaMD: begin pre-submission process with FDA | Month 12 |
| DentalMonitoring's De Novo can serve as predicate device | — |

### EU MDR Considerations

DentalMonitoring achieved EU MDR Class IIa certification in 2024. If our AI features qualify as a medical device in Europe:
- Class IIa requires Notified Body assessment
- Clinical evaluation required
- Post-market surveillance required
- Timeline: 12–18 months from initiation

---

## 5. Data Security Checklist (MVP)

### Before Launch

- [ ] AWS account with BAA signed
- [ ] VPC configured with private subnets for database
- [ ] RDS encryption enabled (AES-256)
- [ ] S3 bucket encryption with KMS
- [ ] TLS 1.3 configured on all endpoints
- [ ] Auth0 configured with MFA for staff accounts
- [ ] Audit logging implemented and tested
- [ ] Access control matrix documented and implemented
- [ ] BAAs signed with all sub-processors
- [ ] Privacy policy drafted and reviewed by counsel
- [ ] Terms of service drafted and reviewed by counsel
- [ ] Patient consent forms created (service + AI training)
- [ ] Incident response plan documented
- [ ] Initial risk assessment completed
- [ ] Penetration test scheduled (before external beta)

### Ongoing

- [ ] Quarterly access reviews
- [ ] Annual HIPAA risk assessment
- [ ] Annual penetration testing
- [ ] Continuous security monitoring
- [ ] Employee training (annual refresh)
- [ ] Breach notification procedures tested
