# Tech Stack

## Recommended Stack

### Processing Server (Python)

| Layer | Technology | Why |
|-------|-----------|-----|
| **API Framework** | FastAPI | Async, fast, great for ML workloads, auto-docs |
| **Task Queue** | Celery + Redis | Distributed job processing, retries, monitoring |
| **VAD** | Silero VAD | Lightweight, accurate, MIT license |
| **Transcription** | faster-whisper (CTranslate2) | Best speed/accuracy, GPU optimized |
| **Diarization** | pyannote.audio 3.1 | State-of-the-art, handles overlap |
| **Speaker Embeddings** | SpeechBrain ECAPA-TDNN | Best open-source speaker encoder |
| **NLP Extraction** | LLM (Llama 3.1 70B or GPT-4o) | Structured extraction from transcripts |
| **Embeddings (text)** | sentence-transformers (all-MiniLM-L6-v2) or OpenAI | Semantic search vectors |

### Data Layer

| Component | Technology | Why |
|-----------|-----------|-----|
| **Primary DB** | PostgreSQL 16+ | Rock solid, JSON support, extensible |
| **Vector Search** | pgvector extension | Voiceprints + semantic search in one DB |
| **Knowledge Graph** | Neo4j or Apache AGE (PG extension) | Relationship queries, traversals |
| **Object Storage** | MinIO (self-host) or S3 | Raw audio archival |
| **Cache** | Redis | Hot data, task queue backend, sessions |
| **Search** | pgvector + pg_trgm | Hybrid vector + text search |

### Mobile App

| Component | Technology | Why |
|-----------|-----------|-----|
| **Framework** | React Native or Flutter | Cross-platform, one codebase |
| **State** | Zustand or Riverpod | Lightweight state management |
| **Local DB** | SQLite (expo-sqlite) | Offline-first knowledge graph cache |
| **BLE** | react-native-ble-plx | Device communication |
| **On-device ML** | Whisper.cpp (GGML) | Real-time streaming transcription |
| **Notifications** | FCM / APNs | Whisper mode delivery |

### Infrastructure

| Component | Technology | Why |
|-----------|-----------|-----|
| **Container** | Docker + Docker Compose | Easy self-hosting |
| **Orchestration** | Docker Compose (small) / K8s (scale) | Multi-service management |
| **GPU** | NVIDIA CUDA 12+ | Required for ML inference |
| **Monitoring** | Prometheus + Grafana | Pipeline metrics, costs |
| **Logging** | Structured JSON → Loki | Debugging, audit trail |

## Alternative Approaches

### Option A: All Local / Self-Hosted (Privacy Maximalist)
```
Device → Home Server (GPU) → Local Storage
- All processing on user's hardware
- Requires: NVIDIA GPU (RTX 3060+ minimum)
- Pro: Maximum privacy
- Con: User manages infrastructure, $500+ GPU cost
```

### Option B: Cloud Processing (Convenience)
```
Device → Cloud API → Cloud Storage → Cloud Processing
- AWS/GCP with GPU instances
- Pro: No user hardware needed, scales easily
- Con: Data leaves user's control, ongoing cloud costs (~$50-100/mo per user)
```

### Option C: Hybrid (Recommended)
```
Device → User's phone (BLE) → Cloud processing → Results to phone
- Audio uploads encrypted to cloud
- Processing on managed GPU infrastructure
- Results + knowledge graph synced back to phone
- Raw audio deleted after processing (configurable)
- Pro: Best UX, no user hardware needed
- Con: Requires cloud trust (mitigated by encryption + deletion policy)
```

### Option D: Edge Processing (Future)
```
Device → Phone (on-device ML) → Optional cloud for heavy processing
- Whisper.cpp on phone for basic transcription
- Speaker ID against local cache
- Heavy NLP extraction deferred to nightly cloud batch
- Pro: Real-time features without cloud dependency
- Con: Lower accuracy for on-device models, phone battery drain
```

## GPU Requirements

### Minimum (Single User)
- NVIDIA RTX 3060 12GB or equivalent
- Process ~8 hours of audio in ~2 hours
- Run Whisper large-v3 + pyannote + ECAPA concurrently

### Recommended (Small Scale, <10 Users)
- NVIDIA RTX 4090 24GB
- Or cloud: 1x A10G instance
- Process multiple users in parallel

### Scale (100+ Users)
- GPU pool: Multiple A100/H100
- Kubernetes with GPU scheduling
- Batch processing with priority queues

## Estimated Costs (Cloud, Per User Per Month)

| Component | Cost |
|-----------|------|
| GPU processing (~2hr/day on A10G) | $30-50 |
| Storage (audio 30 days + transcripts) | $5-10 |
| Database (PostgreSQL + pgvector) | $10-20 |
| LLM extraction (if using API) | $10-30 |
| **Total** | **$55-110/mo** |

Self-hosted: One-time GPU cost ($500-1500) + electricity (~$10-20/mo).
