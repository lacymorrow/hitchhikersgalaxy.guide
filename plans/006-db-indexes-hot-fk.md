# Plan 006: Add DB indexes on hot foreign-key columns

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. If anything in the "STOP conditions" section occurs,
> stop and report. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/db/schema.ts`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none. (Coordinate with plan 004 if both touch the schema in parallel.)
- **Category**: performance
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/227

## Why this matters

The Drizzle schema declares foreign keys with `.references(…)` but does NOT
add corresponding `index()` declarations. Postgres does not auto-index
non-primary-key foreign-key columns. The hottest query patterns in the app
filter on these columns:

- `teamMembers.findMany({ where: eq(userId, X) })` — every dashboard load
- `projectMembers.findMany({ where: eq(userId, X) })` — every dashboard load
- `payments.findMany({ where: eq(userId, X) })` — subscription status checks on most authenticated requests
- `teamMembers.findMany({ where: eq(teamId, X) })` — team page loads, member lists

Without indexes, these queries do sequential scans. At small scale that's
fine; once a single team has hundreds of members or a user has thousands of
payments, latency rises linearly. The fix is additive (zero behavior change)
and one small migration.

## Current state

```ts
// src/server/db/schema.ts:87-103 (payments — no index on userId)
export const payments = createTable("payment", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),  // ← no index
  …
});

// src/server/db/schema.ts:304-320 (teamMembers — no indexes)
export const teamMembers = createTable("team_member", {
  id: varchar("id", { length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),   // ← no index
  teamId: varchar("team_id", { length: 255 }).notNull().references(() => teams.id, { onDelete: "cascade" }),  // ← no index
  role: varchar("role", { length: 50 }).notNull(),
  …
});

// src/server/db/schema.ts:343-359 (projectMembers — same shape, same gap)
```

If plan 004 lands first, it adds `uniqueIndex` on `(processor, processorOrderId)`. This plan's `(userId)` index is a separate query pattern and both should coexist.

## Commands you will need

| Purpose   | Command               | Expected                          |
| --------- | --------------------- | --------------------------------- |
| Install   | `bun install`         | exit 0                            |
| Generate  | `bun run db:generate` | new migration with `CREATE INDEX` |
| Migrate   | `bun run db:migrate`  | exit 0                            |
| Typecheck | `bun run typecheck`   | no new errors                     |

## Scope

**In scope:**

- `src/server/db/schema.ts` — add `index()` declarations on:
  - `payments.userId`
  - `teamMembers.userId`
  - `teamMembers.teamId`
  - `projectMembers.userId`
  - `projectMembers.projectId`
- A new generated migration.

**Out of scope:**

- `apiKeys`, `feedback`, `deployments`, `temporaryLinks` columns — they
  may also be index candidates, but each needs its own query-pattern
  evidence. Don't add speculative indexes; they cost write throughput. Add
  follow-up plans if profiling shows a need.
- Composite indexes beyond what's listed here.
- Index tuning for the `payments(processor, processorOrderId)` unique index
  (plan 004's territory).
- Removing unused indexes (no audit of the existing ones in this plan).

## Git workflow

- Branch: `advisor/006-db-indexes-fk`
- One commit: `perf(db): index foreign-key columns on payments, teamMembers, projectMembers`

## Steps

### Step 1: Locate Drizzle's `index` helper import

In `src/server/db/schema.ts`, the top imports already include things from
`drizzle-orm/pg-core`. Ensure `index` is in that list. If not, add it:

```ts
import { … , index } from "drizzle-orm/pg-core";
```

### Step 2: Add the second argument (table builder) to each affected table

Drizzle table definitions can pass a second callback returning an index map.

For `payments`:

```ts
export const payments = createTable(
  "payment",
  { … fields unchanged … },
  (t) => ({
    userIdIdx: index("payment_user_id_idx").on(t.userId),
  }),
);
```

For `teamMembers`:

```ts
export const teamMembers = createTable(
  "team_member",
  { … fields unchanged … },
  (t) => ({
    userIdIdx: index("team_member_user_id_idx").on(t.userId),
    teamIdIdx: index("team_member_team_id_idx").on(t.teamId),
  }),
);
```

For `projectMembers`:

```ts
export const projectMembers = createTable(
  "project_member",
  { … fields unchanged … },
  (t) => ({
    userIdIdx: index("project_member_user_id_idx").on(t.userId),
    projectIdIdx: index("project_member_project_id_idx").on(t.projectId),
  }),
);
```

If a table already declares a second-argument callback (it probably doesn't, but check), merge the new indexes into the existing return object — don't replace.

### Step 3: Generate the migration

`bun run db:generate`

Inspect the migration file. Expect five `CREATE INDEX` statements (with the
table-prefix applied if `DB_PREFIX` is set). No `DROP` statements, no
`ALTER TABLE` column changes — additive only.

### Step 4: Apply locally

`bun run db:migrate`

**Verify**: indexes appear in Drizzle Studio (`bun run db:studio`) under each table.

### Step 5: Smoke verification with EXPLAIN

(Optional but recommended.) Connect with `psql` and run:

```sql
EXPLAIN ANALYZE SELECT * FROM "payment" WHERE user_id = 'some-uuid';
```

Expect `Index Scan using payment_user_id_idx`. Run for each new index.

If a query still does a Seq Scan because the table is tiny, that's
Postgres correctly choosing the cheaper plan for small tables — fine.

### Step 6: Update or add a note in `CLAUDE.md`'s "Database Best Practices" section

Add one bullet: _Index every foreign-key column declared with `.references(…)`._ This is a one-line convention add. (If a project-wide rule already says this and the codebase just drifted from it, skip.)

## Test plan

No new application-level tests — indexes don't change correctness. The
migration is the artifact.

For confidence, the existing test suite must continue to pass: `bun run test`.

## Done criteria

- [ ] Drizzle migration with five `CREATE INDEX` statements exists.
- [ ] `bun run db:migrate` succeeded locally.
- [ ] `bun run typecheck` exits 0.
- [ ] `bun run test` exits 0.
- [ ] `grep -nE 'index\\(.*(user_id_idx|team_id_idx|project_id_idx)' src/server/db/schema.ts` shows five matches.
- [ ] (Optional) EXPLAIN ANALYZE confirms Index Scan on a populated table.
- [ ] `plans/README.md` status row for 006 updated.

## STOP conditions

- Drizzle generate produces a migration that ALSO contains unexpected schema
  changes (drops, type alters). Something else drifted. Inspect, then
  report.
- A table already has a _unique_ index covering the column you're adding a
  non-unique index for (e.g. `teamMember(userId, teamId)` unique elsewhere
  might cover `userId` for some queries but not all). Inspect: if the
  existing unique index does NOT have the column as its leftmost field, your
  new single-column index is still necessary. If it does, skip that one.
- Production database is on a managed service where migrations are applied
  out-of-band (Vercel + a separate db management tool). The plan stops at
  "migration file generated" then; production rollout is the operator's
  call.

## Maintenance notes

- These indexes are additive: rolling them back via a down-migration is
  zero-risk. If a future plan adds a composite index that supersedes one
  of these, it's safe to drop the smaller index.
- Future plans should consider indexes for query patterns observed in
  slow-query logs, not speculatively. Don't index every column.
- Reviewer should scrutinize: index names follow `<table>_<column>_idx`
  convention; no index covers a column already indexed by the primary key
  (PK on `id` already covers `id`-keyed lookups).

## Backfill candidate for `shipkit-io/bones`

Yes — schema is shared. Backfill after merge.
