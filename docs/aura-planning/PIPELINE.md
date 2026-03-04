# Audio Processing Pipeline

## Stage 1: Ingest

Raw audio arrives as Opus-encoded files from the device. A full day might be 12-16 hours of recording at ~28kbps = **~150-200MB per day**.

### Chunking Strategy
- Split into 5-minute processing chunks with 30s overlap (for speaker continuity)
- Decode Opus → 16kHz mono WAV for processing
- Preserve original timestamps relative to device clock

## Stage 2: Voice Activity Detection (VAD)

**Purpose**: Strip silence and non-speech audio before expensive processing.

### Recommended: Silero VAD
- Lightweight, runs on CPU
- ~1ms per 30ms audio frame
- Excellent at distinguishing speech from background noise
- Open source (MIT license)

### Output
- Speech segments with start/end timestamps
- Confidence scores
- Estimated 30-50% of a typical day is actual speech → reduces processing by half

### Alternative: WebRTC VAD
- Even lighter but less accurate
- Good fallback for on-device pre-filtering

## Stage 3: Transcription

**Purpose**: Convert speech audio to timestamped text.

### Option A: Whisper Large-v3 (Best Accuracy)
- OpenAI's Whisper, self-hosted via faster-whisper (CTranslate2)
- Word-level timestamps
- Handles multiple languages, accents, background noise
- ~6x real-time on GPU (1 hour audio → ~10 min processing)
- **Model size**: 1.5GB (large-v3)

### Option B: Distil-Whisper (Speed/Accuracy Balance)
- 50% faster than large-v3, within 1% WER
- Good for real-time streaming mode

### Option C: Whisper.cpp (On-Device)
- For real-time phone processing
- Medium model fits on modern phones
- Lower accuracy but instant results

### Configuration
```yaml
transcription:
  model: "large-v3"
  backend: "faster-whisper"
  language: "auto"  # auto-detect, but hint "en"
  beam_size: 5
  word_timestamps: true
  vad_filter: true  # internal VAD as secondary filter
  compute_type: "float16"  # GPU optimization
```

## Stage 4: Speaker Diarization

**Purpose**: Determine "who spoke when" — segment audio by speaker turns.

### Recommended: pyannote.audio 3.1
- State-of-the-art speaker diarization
- Handles overlapping speech
- Mono audio, 16kHz
- Real-time factor ~2.5% on GPU (1 hour → ~1.5 min)
- **Key output**: Speaker turn segments (SPEAKER_00, SPEAKER_01, etc.)

### Pipeline
```python
from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token="HF_TOKEN"
)

diarization = pipeline("audio.wav", min_speakers=1, max_speakers=10)

for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f} → {turn.end:.1f}: {speaker}")
```

### Output Alignment
Merge diarization output with Whisper transcripts by aligning timestamps:
- Each word gets a speaker label
- Handle edge cases: overlapping speech, speaker changes mid-word

## Stage 5: Speaker Embedding Extraction

**Purpose**: Generate voiceprint vectors for each detected speaker segment.

### Recommended Models

| Model | Embedding Dim | Training Data | Notes |
|-------|-------------|--------------|-------|
| **ECAPA-TDNN** (SpeechBrain) | 192 | VoxCeleb1+2 | Best open-source, state-of-the-art |
| **WeSpeaker ResNet** | 256 | VoxCeleb | Strong alternative |
| **Picovoice Eagle** | — | Proprietary | On-device capable, commercial |
| **TitaNet** (NVIDIA NeMo) | 192 | VoxCeleb + internal | High accuracy, heavy |

### Embedding Extraction
```python
from speechbrain.inference.speaker import EncoderClassifier

encoder = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cuda"}
)

# Extract embedding for a speaker segment
embedding = encoder.encode_batch(audio_segment)
# → tensor of shape (1, 192)
```

### Voiceprint Quality
- Minimum 10 seconds of clean speech for a reliable voiceprint
- Average across multiple segments for stability
- Store rolling average + variance for each known speaker

## Stage 6: Speaker Identification

**Purpose**: Match anonymous speaker labels to known people.

### Process
1. For each speaker in a diarization session, extract embedding
2. Compare against known voiceprint database (cosine similarity)
3. Threshold: similarity > 0.75 → confident match
4. 0.55 < similarity < 0.75 → possible match, flag for review
5. similarity < 0.55 → new/unknown speaker

### New Speaker Enrollment
When an unknown speaker is detected:
1. Store their embedding with a temporary label ("Unknown Person #47")
2. Cluster across multiple conversations — same unknown voice = same person
3. Prompt user via app: "You spoke with an unidentified person 3 times this week. Can you name them?"
4. User labels → update voiceprint DB with real name
5. Retroactively label all past conversations with this person

### The Owner's Voiceprint
- Enrolled during setup (speak for 30 seconds)
- Always identified first — everything else is "someone talking to the user"
- Enables: "what did I say" vs "what did they say" queries

## Stage 7: Transcript Assembly

Final output per conversation:

```json
{
  "conversation_id": "conv_20260304_143022",
  "start_time": "2026-03-04T14:30:22Z",
  "end_time": "2026-03-04T14:45:18Z",
  "location": null,
  "speakers": [
    {"id": "user", "name": "Lacy", "confidence": 0.99},
    {"id": "spk_sarah_m", "name": "Sarah Mitchell", "confidence": 0.91}
  ],
  "segments": [
    {
      "start": 0.0,
      "end": 3.2,
      "speaker": "spk_sarah_m",
      "text": "Hey Lacy, did you ever finish that kitchen renovation?",
      "words": [...]
    },
    {
      "start": 3.4,
      "end": 8.1,
      "speaker": "user",
      "text": "Almost! The countertops are going in next week. Went with quartz after all.",
      "words": [...]
    }
  ]
}
```

## Processing Budget (Per Day)

Assuming 8 hours of speech content after VAD filtering:

| Stage | Time (GPU) | Time (CPU) |
|-------|-----------|-----------|
| VAD | ~30s | ~2min |
| Transcription (large-v3) | ~80min | ~8hr (impractical) |
| Diarization | ~12min | ~60min |
| Speaker Embedding | ~5min | ~20min |
| **Total** | **~100min** | N/A (GPU required) |

A single NVIDIA RTX 4090 or A100 can process a full day in under 2 hours. Multiple users would need GPU pooling or cloud burst.
