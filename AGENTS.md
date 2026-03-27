# AGENTS.md — Shipkit Harness Engineering Guide

> This file provides AI coding agents with progressive context for working effectively in this codebase.
> Read CLAUDE.md first for commands and architecture. This file covers agent-specific workflows, constraints, and proof-of-work requirements.

## Quick Start for Agents

1. **Orientation**: Read `CLAUDE.md` for commands, architecture, and conventions.
2. **Scope**: Understand the task boundaries before writing code.
3. **Verify**: Run `bun run typecheck && bun run lint && bun run test` before marking work complete.
4. **Proof of Work**: Post verification results (pass/fail + output) in your task update.

## Machine Legibility Contract

All business logic, architectural decisions, and domain context lives in this repository. If information isn't in the codebase, it doesn't exist for agents.

**Context hierarchy (read in order):**
1. `CLAUDE.md` — Commands, architecture, conventions, environment setup
2. `AGENTS.md` (this file) — Agent workflows, constraints, verification
3. `WORKFLOW.md` — Task lifecycle and proof-of-work contract
4. `.cursor/rules/*.mdc` — Domain-specific coding rules (38 files)
5. `tests/README.md` — Testing patterns and structure
6. Source code and inline comments

## Golden Rules

These mechanical rules keep the codebase consistent across agent runs. Violations will cause CI failures or review rejection.

### Code Style (Non-Negotiable)
- Files must stay under **500 lines**. Split if approaching limit.
- **Arrow functions** for components, **function keyword** for utilities.
- **Interfaces** over types. **No enums** — use objects/maps.
- **Named exports** only. No default exports.
- **kebab-case** files, **PascalCase** components, **camelCase** variables.
- Preserve existing comments. Add comments only for "why", never "what".

### Architecture (Non-Negotiable)
- **Server Components first**. Only add `'use client'` when strictly necessary.
- **Never use server actions for data fetching**. Use Server Components.
- **Services layer** (`server/services/`) for business logic.
- **Actions layer** (`server/actions/`) calls services. Components use actions.
- **Timestamps over booleans** in database schemas (`activeAt` not `isActive`).

### What Agents Must NOT Do
- Create new files unless absolutely necessary. Prefer editing existing files.
- Add dependencies without explicit approval.
- Modify CI/CD workflows without explicit approval.
- Touch `.env*` files or commit secrets.
- Skip type checking or linting.
- Make "improvements" beyond the assigned task scope.
- Add error handling for impossible scenarios.
- Create abstractions for one-time operations.

## Proof of Work Requirements

Before marking any task as complete, agents MUST run and report results for:

```bash
# Minimum verification (all tasks)
bun run typecheck    # Must pass with 0 errors
bun run lint         # Must pass (run lint:fix first if needed)

# For code changes
bun run test         # Must pass with 0 failures

# For UI changes
bun run build        # Must complete successfully
```

**Report format** (include in task comment):
```
## Verification
- typecheck: PASS (0 errors)
- lint: PASS
- test: PASS (X tests, 0 failures)
- build: PASS / N/A
```

If any check fails, the task is NOT done. Fix the issue or report the blocker.

## Task Scoping Guidelines

### Good agent tasks (single-responsibility, verifiable)
- Fix a specific bug with a reproduction case
- Add a single component following existing patterns
- Refactor one file to match conventions
- Add tests for existing functionality
- Update documentation to match current code

### Tasks that need human decomposition first
- Multi-file architectural changes
- New feature systems spanning multiple domains
- Database schema redesigns
- Authentication/authorization changes
- Payment integration modifications

## File Discovery Patterns

```bash
# Find components
ls src/components/           # Atomic: primitives/ blocks/ layouts/
ls src/components/ui/        # Shadcn/UI components

# Find server code
ls src/server/actions/       # Server actions
ls src/server/services/      # Business logic
ls src/server/db/            # Database schema and queries

# Find routes
ls src/app/                  # App router structure
ls src/app/(app)/            # Main app routes
ls src/app/(dashboard)/      # Protected routes
ls src/app/api/              # API routes

# Find config
ls src/config/               # Feature flags, app config
ls src/lib/                  # Utilities
```

## Testing Patterns for Agents

### Writing hermetic tests
- Tests must be self-contained — no external service dependencies.
- Use `safeDbExecute` for database operations in tests.
- Mock external APIs, never make real network calls.
- Each test must be independent — no shared mutable state.

### Test file placement
| Test type | Directory | Command |
|-----------|-----------|---------|
| Unit (utils, components) | `tests/unit/` | `bun run test` |
| Node.js (server, API) | `tests/node/` | `bun run test:node` |
| Browser (DOM, rendering) | `tests/browser/` | `bun run test:browser` |
| E2E (user flows) | `tests/e2e/` | `bun run test:e2e` |

## Error Recovery

If you break something:
1. Run `git diff` to see what changed.
2. Run `bun run typecheck` to identify type errors.
3. Run `bun run lint:fix` to auto-fix formatting.
4. If stuck, revert with `git checkout -- <file>` and try a different approach.
5. Never force through errors — understand the root cause first.

## Environment & Feature Flags

Features auto-enable based on environment variables. See `src/config/features-config.ts`.

When working on feature-flagged code, always handle the disabled case gracefully.
