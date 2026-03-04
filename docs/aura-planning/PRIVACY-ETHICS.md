# Privacy & Ethics

## The Elephant in the Room

An always-on audio recorder raises serious ethical questions. We have to address them head-on, not as an afterthought.

## Legal Framework

### Recording Consent Laws
- **One-party consent states** (most US states): Legal to record if you're a participant
- **Two-party/all-party consent states** (CA, FL, IL, WA, etc.): All participants must consent
- **Federal (US)**: One-party consent under federal wiretap law
- **EU/GDPR**: Requires explicit consent for processing personal data of others
- **Workplace**: Additional regulations may apply

### Our Approach
1. **Default to most restrictive** — design for two-party consent as baseline
2. **Consent mode setting** — user selects their legal jurisdiction
3. **Consent indicators** — optional visible/audible recording indicator on device
4. **Opt-out mechanism** — others can request their voice data be deleted

## Data Security

### Encryption
- **At rest**: AES-256 encryption on device storage
- **In transit**: TLS 1.3 for all uploads
- **At rest (server)**: Encrypted volumes, key management via Vault/KMS
- **Voiceprints**: Stored as embeddings (not reconstructable to audio)

### Access Control
- User's data is siloed — no cross-user access
- API authentication per device + per user
- No admin backdoor to user audio
- Audit logs for all data access

### Data Ownership
- **User owns everything** — audio, transcripts, knowledge graph
- **Full export** — GDPR-compliant data portability (JSON + audio archives)
- **Full delete** — right to be forgotten, including all derived data
- **No training** — user data never used for model training without explicit opt-in

## Ethical Design Decisions

### What We Record
- All audio when device is active and unpaused
- Raw audio retained for configurable period (default 30 days), then deleted
- Transcripts and knowledge graph retained longer (user configurable)

### What We Don't Do
- **No selling data** — ever
- **No advertising** — the product is the product
- **No law enforcement access** without valid warrant AND user notification
- **No emotion manipulation** — we report sentiment, we don't weaponize it
- **No non-consensual surveillance** — this is for the wearer, not for watching others

### Third-Party Privacy
People you talk to didn't choose to be recorded. We address this by:

1. **Voice data of others** — stored only as embeddings, not raw audio (after processing)
2. **Transcript redaction** — option to auto-redact sensitive info from others' speech
3. **Delete requests** — if someone asks you to delete their data, one-tap removal
4. **Minimal retention** — raw audio of non-user speakers deleted after processing
5. **No facial recognition** — audio only, no camera

### Edge Cases
- **Minors** — extra caution, consider auto-detection and enhanced privacy
- **Medical conversations** — HIPAA considerations, option to auto-pause
- **Legal conversations** — attorney-client privilege concerns
- **Intimate moments** — pause button, location-based auto-pause

## Self-Hosting Option

For maximum privacy, support self-hosted processing:
- Docker compose stack for home server / NAS
- All processing local — no cloud dependency
- GPU required (or very patient CPU processing)
- Trade-off: user manages their own infrastructure

## Transparency

- Open source processing pipeline (this repo)
- Published privacy policy in plain English
- Regular third-party security audits
- Canary page for government data requests
