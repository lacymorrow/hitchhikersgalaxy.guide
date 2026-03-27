# WORKFLOW.md — Agent Task Lifecycle Contract

> Defines the task lifecycle, verification gates, and proof-of-work requirements for AI agents working on Shipkit.
> Inspired by OpenAI's Symphony orchestration pattern.

## Task Lifecycle

```
Assigned → Checkout → Understand → Implement → Verify → Report
```

### 1. Assigned
Agent receives a task via Paperclip or direct assignment.

### 2. Checkout
Agent claims the task. No two agents work on the same task.

### 3. Understand
Before writing any code:
- Read the task description and all comments
- Read parent/ancestor tasks for context
- Identify affected files using file discovery patterns (see AGENTS.md)
- Read existing code before proposing changes

### 4. Implement
Write code following all golden rules in AGENTS.md. Key constraints:
- Single-responsibility changes only
- Stay within task scope — no drive-by improvements
- Prefer editing existing files over creating new ones

### 5. Verify (Proof of Work Gate)
This gate MUST pass before any task can be marked complete.

```bash
# Gate 1: Type safety
bun run typecheck
# Expected: 0 errors

# Gate 2: Code quality
bun run lint
# Expected: 0 errors (run lint:fix first)

# Gate 3: Test suite
bun run test
# Expected: 0 failures, no regressions

# Gate 4: Build (for UI/structural changes)
bun run build
# Expected: successful build
```

**Failure protocol:**
- If Gate 1 fails → fix type errors, re-run
- If Gate 2 fails → run `bun run lint:fix`, review changes, re-run
- If Gate 3 fails → investigate failure, fix regression, re-run
- If Gate 4 fails → investigate build error, may need to revert approach
- If stuck after 2 attempts → mark task as blocked with detailed blocker description

### 6. Report
Post verification results in the task. Include:
- What was changed and why
- Verification gate results (pass/fail with output)
- Any follow-up work identified

## Verification Configuration

```yaml
project:
  name: shipkit
  repo: https://github.com/lacymorrow/shipkit

verification:
  typecheck:
    command: "bun run typecheck"
    required: true
    timeout_ms: 120000
  lint:
    command: "bun run lint"
    required: true
    timeout_ms: 60000
    autofix: "bun run lint:fix"
  test:
    command: "bun run test"
    required: true
    timeout_ms: 300000
  build:
    command: "bun run build"
    required: false  # Only for UI/structural changes
    timeout_ms: 600000

agent:
  max_retries: 2
  timeout_ms: 3600000  # 1 hour max per task
```

## Concurrency Rules

- One agent per task (enforced by checkout)
- Multiple agents can work on different tasks in the same repo
- Agents must not modify files outside their task scope
- If two tasks touch the same file, they should be serialized

## Escalation Protocol

When an agent cannot complete a task:

1. **Blocked by missing context** → Comment with specific questions, set status to `blocked`
2. **Blocked by another task** → Link the blocking task, set status to `blocked`
3. **Blocked by external dependency** → Document the dependency, set status to `blocked`
4. **Task too large** → Propose decomposition into subtasks, request human review
5. **Conflicting requirements** → Document the conflict, request human decision
