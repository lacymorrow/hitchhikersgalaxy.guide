# Speaker Identification System

## Overview

Speaker identification is the core differentiator. We're not just transcribing — we're building a persistent identity for every person in the user's life, linked across every conversation over months and years.

## Architecture

```
Audio Segment (per speaker turn)
    │
    ▼
Embedding Extraction (ECAPA-TDNN, 192-dim)
    │
    ▼
┌───────────────────────────────┐
│     Voiceprint Database       │
│                               │
│  ┌─────────────────────────┐  │
│  │ Known Speakers          │  │
│  │ • lacy (owner)          │  │
│  │ • sarah_mitchell         │  │
│  │ • mike_chen             │  │
│  │ • mom                   │  │
│  │ • [200+ people...]      │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │ Unknown Clusters        │  │
│  │ • cluster_047 (3 convos)│  │
│  │ • cluster_048 (1 convo) │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
    │
    ▼
Cosine Similarity Search (pgvector)
    │
    ├── > 0.75 → Confident match → label transcript
    ├── 0.55-0.75 → Candidate match → flag for review
    └── < 0.55 → Unknown → cluster & track
```

## Voiceprint Storage Schema

```sql
CREATE TABLE speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT,
    label TEXT,  -- user-facing label ("Mom", "Sarah from work")
    relationship TEXT,  -- "mother", "coworker", "friend"
    first_heard TIMESTAMPTZ,
    last_heard TIMESTAMPTZ,
    total_speech_seconds FLOAT DEFAULT 0,
    conversation_count INT DEFAULT 0,
    embedding_avg VECTOR(192),  -- rolling average voiceprint
    embedding_samples VECTOR(192)[],  -- last N embeddings for variance
    confidence FLOAT DEFAULT 0,  -- ID confidence based on sample count
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast similarity search
CREATE INDEX idx_speakers_embedding ON speakers
    USING ivfflat (embedding_avg vector_cosine_ops)
    WITH (lists = 100);
```

## Challenges & Solutions

### 1. Voice Variability
A person's voice varies by:
- Emotional state (calm vs excited vs angry)
- Health (cold, tired, hoarse)
- Environment (quiet room vs noisy street)
- Distance from mic (close whisper vs across the room)

**Solution**: Store multiple embedding samples (not just average). Use the variance to set per-speaker thresholds. A speaker with high variance needs more samples before confident identification.

### 2. Similar Voices
Some people sound similar, especially:
- Family members (genetic vocal similarity)
- Same gender/age cohorts

**Solution**:
- Context-aware matching: If you're at home, weight family voiceprints higher
- Temporal continuity: Once identified in a conversation, maintain that ID
- Multi-feature: Combine voice embedding with speech patterns (vocabulary, pace, pitch contour)

### 3. Background Speakers
TV, radio, podcasts, overheard strangers.

**Solution**:
- Distance estimation from audio characteristics (reverb, volume)
- Duration threshold: Ignore speakers with < 5 seconds of speech
- User can mark "ignore background" for certain time ranges
- TV/podcast detection: Recognize processed/broadcast audio characteristics

### 4. Enrollment UX
Getting users to label unknown speakers.

**Solution** — progressive enrollment:
1. **Auto-enroll owner** during setup (30s speech sample)
2. **Prompt strategically**: "You had a 20-minute conversation with someone new today. Here's a clip — who is this?"
3. **Suggest from context**: If transcript mentions "Hey Sarah" → suggest "Sarah" as label
4. **Cluster first**: Don't ask until the same voice appears in 2+ conversations
5. **Passive learning**: User can say "Hey Aura, that was my friend Mike" → enrollment

### 5. Voiceprint Drift
Voices change over months/years.

**Solution**:
- Rolling average with exponential decay (recent samples weighted more)
- Re-validate periodically: If confidence drops, ask user to confirm
- Store embedding history for temporal analysis

## Name Detection from Audio

Beyond voiceprint matching, extract names from the conversation itself:

1. **Direct address**: "Hey Sarah", "Thanks Mike"
2. **Introduction**: "I'm John", "This is my friend Alex"
3. **Third-party reference**: "Sarah told me that..."
4. **Phone context**: If paired with phone, incoming call/contact name

### NER Pipeline for Name Extraction
```python
# After transcription, extract names from text
# Use spaCy or LLM for named entity recognition
# Cross-reference with speaker turns:
# If SPEAKER_01 says "I'm John" → candidate name for SPEAKER_01
```

## Metrics

Track per-speaker:
- **Identification accuracy**: % of correct IDs (validated by user corrections)
- **False positive rate**: Misidentifications
- **Time to enrollment**: How many conversations before reliable ID
- **Voiceprint stability**: Embedding variance over time
