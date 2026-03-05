# UX Concepts

## Product Surfaces

### 1. The Necklace (Hardware)
- **Invisible operation** — no screens, no buttons (maybe one for pause/privacy)
- **LED indicators** — subtle: charging, recording, uploading, error
- **Haptic feedback** — gentle vibration for whisper mode alerts
- **Pause gesture** — tap twice to pause recording (for private moments)

### 2. Mobile App (Primary Interface)
The daily touchpoint. Morning coffee companion.

### 3. Whisper Mode (Real-Time Assistant)
Delivered via:
- Phone notification (silent/vibrate)
- Bone conduction earpiece (future)
- Smartwatch tap

## Mobile App Screens

### Morning Briefing
When you open the app, you see yesterday's processed results:

```
┌─────────────────────────────────┐
│  ☀️ Tuesday, March 4            │
│                                 │
│  You had 12 conversations       │
│  with 8 people over 6.5 hours   │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🔵 Sarah Mitchell    45min ││
│  │    Kitchen renovation,      ││
│  │    her daughter's game      ││
│  ├─────────────────────────────┤│
│  │ 🟢 Mike Chen         20min ││
│  │    Q3 planning, budgets     ││
│  │    ⚡ You promised to send  ││
│  │    the vendor list by Fri   ││
│  ├─────────────────────────────┤│
│  │ 🟡 Unknown Person    5min  ││
│  │    Coffee shop small talk   ││
│  │    [Who is this?]           ││
│  └─────────────────────────────┘│
│                                 │
│  📋 Open Commitments (3)        │
│  🧠 New Facts Learned (7)       │
│  👥 New People Met (1)          │
│                                 │
└─────────────────────────────────┘
```

### People View
Your relationship map:

```
┌─────────────────────────────────┐
│  👥 People           🔍 Search │
│                                 │
│  FREQUENT                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │Sara│ │Mike│ │Mom │ │Jake│  │
│  │ 47 │ │ 31 │ │ 28 │ │ 22 │  │
│  └────┘ └────┘ └────┘ └────┘  │
│                                 │
│  RECENT                         │
│  Sarah Mitchell — today          │
│    "Kitchen renovation, quartz   │
│     countertops next week"       │
│                                 │
│  Mike Chen — today               │
│    "Q3 budget review"            │
│                                 │
│  Dr. Katherine Walsh — Mon       │
│    "Annual checkup, all clear"   │
│                                 │
└─────────────────────────────────┘
```

### Person Detail
Tap on a person:

```
┌─────────────────────────────────┐
│  ← Sarah Mitchell               │
│                                 │
│  👤 Friend / Neighbor            │
│  📅 First met: Oct 2025         │
│  💬 47 conversations             │
│  ⏱️ ~12 hours total              │
│                                 │
│  WHAT YOU KNOW                   │
│  • Daughter Emma plays soccer    │
│  • Renovating her kitchen too    │
│  • Works at Reed & Associates    │
│  • Allergic to cats              │
│  • Husband's name: David         │
│                                 │
│  RECENT CONVERSATIONS            │
│  Mar 4 — Kitchen countertops     │
│  Mar 1 — Emma's tournament       │
│  Feb 26 — Book club planning     │
│                                 │
│  OPEN ITEMS                      │
│  • She's lending you her tile    │
│    saw (mentioned Feb 26)        │
│                                 │
│  [💬 Full Transcript History]    │
│                                 │
└─────────────────────────────────┘
```

### Search
Natural language search over your entire history:

```
┌─────────────────────────────────┐
│  🔍 "what restaurant did sarah  │
│      recommend"                  │
│                                 │
│  Found in conversation with      │
│  Sarah Mitchell, Feb 12:         │
│                                 │
│  "...you have to try Siam       │
│   Garden, that new Thai place   │
│   on Main Street. The pad see   │
│   ew is incredible..."          │
│                                 │
│  📍 Siam Garden, Main Street    │
│  🍜 Thai food                    │
│  [▶️ Play audio clip]            │
│                                 │
└─────────────────────────────────┘
```

### Commitments Tracker

```
┌─────────────────────────────────┐
│  📋 Commitments                  │
│                                 │
│  OVERDUE                         │
│  🔴 Send vendor list to Mike     │
│     Due: Friday Mar 1            │
│     [Mark done] [Snooze]         │
│                                 │
│  UPCOMING                        │
│  🟡 Call dentist for appointment │
│     Mentioned: Feb 28            │
│     [Mark done] [Dismiss]        │
│                                 │
│  OTHERS' COMMITMENTS TO YOU      │
│  🔵 Sarah: Lending tile saw      │
│     Mentioned: Feb 26            │
│                                 │
└─────────────────────────────────┘
```

## Whisper Mode (Real-Time)

The killer feature. Requires BLE streaming to phone.

### Scenario: Forgotten Name
```
[You walk up to someone at a party]
[Voice detected → embedding extracted → matched]

📳 Phone vibrates silently
Notification: "Sarah Mitchell — neighbor. 
Last spoke: kitchen renovation, Emma's soccer."
```

### Scenario: Forgotten Purpose
```
[You walk into the kitchen]
[IMU detects room change]
[Recent audio: "I need to grab my keys from the kitchen counter"]

📳 "You came here for your keys — kitchen counter."
```

### Scenario: Conversation Helper
```
[Mid-conversation, someone mentions a name you should know]

📳 "They're talking about David — Sarah's husband."
```

### Delivery Mechanism Priority
1. **Smartwatch tap** — most discreet
2. **Phone vibration** — check pocket
3. **Bone conduction** — audio whisper (future, requires earpiece)
4. **Nothing** — stored for later review

## Privacy Controls

### In-App Settings
```
┌─────────────────────────────────┐
│  ⚙️ Privacy                     │
│                                 │
│  Recording: [ON] ──── [OFF]     │
│  Pause schedule:                 │
│    🔲 Bathroom                   │
│    🔲 Bedroom (after 10pm)       │
│    🔲 Doctor's office            │
│                                 │
│  Consent mode:                   │
│    ○ Silent (one-party)          │
│    ● Announce (tell people)      │
│    ○ Ask (explicit consent)      │
│                                 │
│  Data retention:                 │
│    Raw audio: [30 days ▼]        │
│    Transcripts: [Forever ▼]      │
│    Knowledge graph: [Forever ▼]  │
│                                 │
│  [🗑️ Delete all my data]        │
│  [📦 Export my data]             │
│                                 │
└─────────────────────────────────┘
```

## Onboarding Flow

1. **Pair device** — BLE setup, WiFi credentials
2. **Voice enrollment** — "Read this paragraph aloud" (30s of speech)
3. **Name your close people** — "Who do you live with? Who do you see most?" (pre-seed the graph)
4. **Set privacy preferences** — consent mode, retention, pause zones
5. **First day** — "Just wear it. Tomorrow morning, open the app for your first briefing."
