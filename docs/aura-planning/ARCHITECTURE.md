# System Architecture

## Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│  AURA NECKLACE  │────▶│  CHARGER/    │────▶│         PROCESSING SERVER           │
│  (Hardware)     │     │  UPLOAD DOCK │     │                                     │
│                 │     │              │     │  ┌─────────┐  ┌──────────────────┐  │
│ • Mic array     │     │ • WiFi       │     │  │  Ingest │─▶│  Audio Pipeline  │  │
│ • Local storage │     │ • USB-C      │     │  └─────────┘  │                  │  │
│ • BLE (phone)   │     │ • Charging   │     │               │ • VAD            │  │
│ • IMU/accel     │     └──────────────┘     │               │ • Transcription  │  │
└─────────────────┘                          │               │ • Diarization    │  │
                                             │               │ • Speaker ID     │  │
┌─────────────────┐                          │               └────────┬─────────┘  │
│  MOBILE APP     │◀────────────────────────▶│                        │            │
│                 │                          │  ┌─────────────────────▼──────────┐ │
│ • Notifications │                          │  │     Analysis & Extraction      │ │
│ • Search        │                          │  │                                │ │
│ • Review        │                          │  │ • Entity extraction (NER)      │ │
│ • Settings      │                          │  │ • Relationship mapping         │ │
│ • Whisper mode  │                          │  │ • Sentiment analysis           │ │
│                 │                          │  │ • Topic classification         │ │
└─────────────────┘                          │  │ • Intent/commitment detection  │ │
                                             │  └───────────────┬────────────────┘ │
                                             │                  │                  │
                                             │  ┌───────────────▼────────────────┐ │
                                             │  │      Knowledge Graph (DB)      │ │
                                             │  │                                │ │
                                             │  │ • People (voiceprints + meta)  │ │
                                             │  │ • Conversations (transcripts)  │ │
                                             │  │ • Relationships (edges)        │ │
                                             │  │ • Facts & memories             │ │
                                             │  │ • Commitments & tasks          │ │
                                             │  │ • Locations & contexts         │ │
                                             │  └───────────────┬────────────────┘ │
                                             │                  │                  │
                                             │  ┌───────────────▼────────────────┐ │
                                             │  │        Query & Delivery        │ │
                                             │  │                                │ │
                                             │  │ • RAG over conversation history│ │
                                             │  │ • Proactive context surfacing  │ │
                                             │  │ • Daily/weekly summaries       │ │
                                             │  │ • Real-time whisper responses  │ │
                                             │  └────────────────────────────────┘ │
                                             └─────────────────────────────────────┘
```

## Two Processing Modes

### 1. Batch Processing (Primary — Nightly Upload)
The device records all day to local storage (compressed audio). At night when docked:
1. Audio uploads over WiFi to processing server
2. Full pipeline runs: VAD → transcription → diarization → speaker ID → NLP extraction → knowledge graph update
3. Daily summary generated
4. Results available in app by morning

**Advantages**: Full computational power, best model quality, no battery drain from processing, no need for constant connectivity.

### 2. Real-Time Streaming (Future — Phone Relay)
For "whisper mode" features (name recall, spatial memory):
1. Device streams audio via BLE to phone
2. Phone runs lightweight VAD + on-device transcription (Whisper.cpp)
3. Speaker identification against local voiceprint cache
4. Quick lookups against local knowledge graph snapshot
5. Whisper notification via bone conduction earpiece or phone haptic

**Advantages**: Immediate context. **Tradeoffs**: Battery drain, requires phone nearby, lower accuracy.

## Data Flow

```
Raw Audio (.opus, ~28kbps)
    │
    ▼
Voice Activity Detection (Silero VAD)
    │ ── discard silence, noise-only segments
    ▼
Speech Segments (.wav chunks, 16kHz mono)
    │
    ├──▶ Transcription (Whisper large-v3 / distil-whisper)
    │        → timestamped text
    │
    ├──▶ Speaker Diarization (pyannote 3.1)
    │        → speaker turn boundaries
    │
    └──▶ Speaker Embedding Extraction (ECAPA-TDNN / WeSpeaker)
             → 192-dim voice embeddings per segment
    │
    ▼
Alignment & Merge
    │ ── combine transcript + speaker labels + embeddings
    ▼
Speaker Identification
    │ ── match embeddings against known voiceprint DB
    │ ── cluster unknowns, prompt user to label
    ▼
Labeled Transcript
    │
    ▼
NLP Extraction Pipeline (LLM-based)
    │
    ├──▶ Named Entity Recognition (people, places, orgs, dates)
    ├──▶ Relationship Extraction (who knows whom, context)
    ├──▶ Sentiment Analysis (per speaker, per conversation)
    ├──▶ Topic Classification
    ├──▶ Commitment Detection ("I'll send you that by Friday")
    ├──▶ Fact Extraction ("Sarah's daughter plays soccer")
    └──▶ Summary Generation (per conversation, per day)
    │
    ▼
Knowledge Graph Update
    │
    ▼
Index & Cache for Query
```

## Server Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Ingest API** | FastAPI | Receive uploads, queue processing |
| **Audio Pipeline** | Python workers (Celery/Dramatiq) | VAD, transcription, diarization |
| **Speaker DB** | PostgreSQL + pgvector | Voiceprint embeddings, identity mapping |
| **Knowledge Graph** | Neo4j or PostgreSQL + Apache AGE | People, relationships, facts |
| **Transcript Store** | PostgreSQL | Full transcripts with timestamps |
| **Vector Store** | pgvector or Qdrant | Semantic search over conversations |
| **LLM Extraction** | Local (Llama 3) or API (GPT-4o) | NLP extraction pipeline |
| **Query API** | FastAPI | App queries, search, summaries |
| **Task Queue** | Redis + Celery | Job orchestration |
| **Object Storage** | S3/MinIO | Raw audio archival |

## Hardware Interface

The processing server needs to handle:
- **Upload protocol**: HTTP multipart or resumable upload (tus protocol)
- **Audio format**: Opus-encoded, ~28kbps, mono, with embedded timestamps
- **Metadata**: Device ID, session start/end times, battery level, IMU data (for activity context)
- **Auth**: Per-device API keys, encrypted in transit (TLS 1.3)
