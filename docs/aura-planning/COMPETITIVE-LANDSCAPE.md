# Competitive Landscape

## Existing Products

### Limitless (formerly Rewind AI)
- **What**: Pendant wearable + desktop app for meeting capture
- **Price**: $99 pendant, freemium software
- **Approach**: Records meetings, generates summaries and action items
- **Strengths**: Polished UX, good transcription, cross-platform
- **Gaps**: Meeting-focused (not always-on life capture), no persistent speaker ID, no knowledge graph, no memory augmentation beyond meetings

### Plaud NotePin / NotePin S
- **What**: Wearable AI voice recorder (clip/pin form factor)
- **Price**: $169
- **Approach**: Record → transcribe → summarize via cloud
- **Strengths**: Great hardware design, long battery, good transcription
- **Gaps**: Session-based (not continuous), no speaker identification, no relationship mapping, no proactive memory features

### Omi (BasedHardware)
- **What**: Open-source AI wearable companion
- **Price**: $89 device, open-source software
- **Approach**: BLE to phone → cloud transcription → plugin ecosystem
- **Strengths**: Open source, active community, plugin architecture
- **Gaps**: Still session-oriented, basic speaker handling, no persistent knowledge graph, privacy concerns (cloud-dependent)

### Bee.Computer
- **What**: Always-on AI companion pendant
- **Approach**: Records → transcribes → discards audio (text only)
- **Strengths**: Strong privacy stance (no audio retention), conversation intelligence
- **Gaps**: No speaker identification, no relationship graph, discards audio immediately (can't improve retroactively)

### Anker Soundcore Work AI
- **What**: Coin-sized wearable recorder with GPT-4o integration
- **Approach**: Record → transcribe → AI summary
- **Gaps**: Meeting/note focused, no always-on, no persistent memory

## What None of Them Do (Our Differentiation)

| Feature | Limitless | Plaud | Omi | Bee | **Aura** |
|---------|----------|-------|-----|-----|----------|
| Always-on recording | ⚠️ meetings | ❌ sessions | ⚠️ sessions | ✅ | ✅ |
| Persistent speaker ID | ❌ | ❌ | ❌ | ❌ | ✅ |
| Voiceprint database | ❌ | ❌ | ❌ | ❌ | ✅ |
| Personal knowledge graph | ❌ | ❌ | ❌ | ❌ | ✅ |
| Relationship mapping | ❌ | ❌ | ❌ | ❌ | ✅ |
| Commitment tracking | ⚠️ action items | ❌ | ❌ | ❌ | ✅ |
| Real-time whisper (name recall) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Essence preservation / legacy | ❌ | ❌ | ❌ | ❌ | ✅ |
| Self-hostable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Open source | ❌ | ❌ | ✅ | ❌ | ✅ |

## Our Positioning

**Aura is not a note-taker. It's a memory system.**

The competitors are building "smart tape recorders" — they capture and summarize individual sessions. Aura builds a cumulative, persistent model of your entire life through audio. Every conversation adds to the graph. Every person becomes more recognized. The system gets smarter every day you wear it.

The closest philosophical comparison is the "Lifelogging" concept from research (Microsoft MyLifeBits, Gordon Bell's work) — but focused specifically on audio and made practical with modern ML.
