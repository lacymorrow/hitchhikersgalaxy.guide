# Knowledge Graph

## Purpose

Every conversation contains structured information about the user's world. The knowledge graph captures this information and makes it queryable. It's the "memory" layer — the thing that knows Sarah's daughter plays soccer, that you promised Mike you'd send that article, that your mom's birthday is next month.

## Graph Schema

### Nodes

```
(Person)
  - id, name, aliases, voiceprint_id
  - relationship_to_user (friend, coworker, family, etc.)
  - first_met, last_seen
  - total_interactions, avg_sentiment
  - physical_description (if mentioned)
  - occupation, organization

(Conversation)
  - id, timestamp, duration
  - location (if known)
  - topic_summary
  - sentiment_avg
  - transcript_id (link to full text)

(Fact)
  - id, subject, predicate, object
  - source_conversation_id
  - confidence, timestamp
  - category (personal, professional, preference, etc.)
  - Examples:
    "Sarah's daughter → plays → soccer"
    "Mike → works at → Acme Corp"
    "User → allergic to → shellfish"
    "Mom → birthday → March 15"

(Commitment)
  - id, description
  - speaker (who committed)
  - target (who it's to)
  - deadline (if mentioned)
  - status (pending, completed, overdue, forgotten)
  - source_conversation_id

(Topic)
  - id, name, category
  - first_discussed, last_discussed
  - frequency

(Location)
  - id, name, type (home, office, restaurant, etc.)
  - associated_people
  - visit_count

(Event)
  - id, name, date
  - participants
  - discussed_in (conversations)
```

### Edges

```
(Person)-[:SPOKE_IN]->(Conversation)
(Person)-[:KNOWS]->(Person)  {context, since, strength}
(Person)-[:WORKS_AT]->(Organization)
(Person)-[:FAMILY_OF]->(Person)  {relation: "mother", "sister", etc.}
(Conversation)-[:ABOUT]->(Topic)
(Conversation)-[:TOOK_PLACE_AT]->(Location)
(Fact)-[:EXTRACTED_FROM]->(Conversation)
(Fact)-[:ABOUT]->(Person)
(Commitment)-[:MADE_BY]->(Person)
(Commitment)-[:MADE_TO]->(Person)
(Commitment)-[:MENTIONED_IN]->(Conversation)
```

## Extraction Pipeline

After transcription + speaker identification, run LLM extraction:

### Step 1: Conversation Segmentation
Split the day's transcript into discrete conversations:
- Gap of > 5 minutes silence = new conversation
- Complete speaker turnover = new conversation
- Location change (if IMU data available) = new conversation

### Step 2: Per-Conversation Extraction

Use an LLM (local Llama 3.1 70B or GPT-4o) with structured output:

```python
EXTRACTION_PROMPT = """
Analyze this conversation transcript and extract:

1. PEOPLE mentioned (not just speakers — anyone referenced)
2. FACTS learned about any person (preferences, attributes, plans)
3. COMMITMENTS made (promises, agreements, plans to do something)
4. TOPICS discussed (main subjects)
5. RELATIONSHIPS revealed (how people know each other)
6. EVENTS mentioned (past or upcoming)
7. EMOTIONS detected (notable emotional moments)

Transcript:
{transcript}

Output as JSON:
{
  "people": [...],
  "facts": [...],
  "commitments": [...],
  "topics": [...],
  "relationships": [...],
  "events": [...],
  "emotions": [...]
}
"""
```

### Step 3: Entity Resolution
- Match extracted names to existing graph nodes
- Handle aliases ("Mom" = "Susan Morrow", "Dr. K" = "Dr. Katherine Walsh")
- Merge duplicate facts
- Update confidence scores for existing facts (mentioned again → higher confidence)

### Step 4: Graph Update
- Insert new nodes and edges
- Update counters (interaction count, last seen)
- Update sentiment rolling averages
- Flag contradictions ("Last month Sarah said she was moving to Boston, now she says Portland")

## Query Patterns

### "Who is this person?"
```cypher
MATCH (p:Person {voiceprint_id: $current_speaker})
OPTIONAL MATCH (p)-[r:KNOWS|FAMILY_OF|WORKS_WITH]->(other:Person)
OPTIONAL MATCH (p)-[:SPOKE_IN]->(c:Conversation)
OPTIONAL MATCH (f:Fact)-[:ABOUT]->(p)
RETURN p, collect(DISTINCT r), collect(DISTINCT f)
ORDER BY c.timestamp DESC LIMIT 5
```

### "What did we talk about last time?"
```cypher
MATCH (user:Person {is_owner: true})-[:SPOKE_IN]->(c:Conversation)<-[:SPOKE_IN]-(p:Person {id: $person_id})
RETURN c.topic_summary, c.timestamp
ORDER BY c.timestamp DESC LIMIT 1
```

### "What do I need to do?"
```cypher
MATCH (c:Commitment {speaker: $user_id, status: 'pending'})
OPTIONAL MATCH (c)-[:MADE_TO]->(p:Person)
RETURN c.description, c.deadline, p.name
ORDER BY c.deadline ASC
```

### "Tell me about Sarah"
```cypher
MATCH (p:Person {name: 'Sarah'})
OPTIONAL MATCH (f:Fact)-[:ABOUT]->(p)
OPTIONAL MATCH (p)-[:SPOKE_IN]->(c:Conversation)
RETURN p, collect(f), count(c) as conversation_count
```

## Semantic Search Layer

Beyond graph queries, enable natural language search over conversation history:

1. **Embed each conversation summary** → vector store
2. **Embed extracted facts** → vector store
3. **RAG pipeline**: User asks question → embed → retrieve relevant conversations + facts → LLM generates answer with citations

```
User: "What restaurant did Sarah recommend?"
    │
    ▼
Semantic search over conversation embeddings
    │
    ▼
Retrieved: Conversation from Feb 12 with Sarah — mentions "that new Thai place on Main Street, Siam Garden"
    │
    ▼
Answer: "Sarah recommended Siam Garden, a Thai restaurant on Main Street. She mentioned it on February 12th."
```

## Storage Estimates

Per user per year (assuming 8hr speech/day):
- Raw transcripts: ~50GB text
- Knowledge graph nodes: ~50K-100K
- Conversation embeddings: ~2GB
- Fact embeddings: ~500MB
- Total graph DB: ~5-10GB
