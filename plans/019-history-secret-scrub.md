# 019 — Shipkit git-history secret scrub

Issue: [LAC-3163](/LAC/issues/LAC-3163)
Owner: Lacy (rotation + force-push) with Security Engineer (mechanics, verification)
Status: PLAN — do not execute the filter-repo step until Phase 1 rotation is confirmed complete.

## Why

Full-history gitleaks scan (2026-07-31, re-verified 2026-08-04) finds 244 leaks
across 1,969 commits. The repo is private, but the credentials must be treated
as live until each provider confirms rotation. Blocks any future flip of
`lacymorrow/shipkit` to public (see also [LAC-3147](/LAC/issues/LAC-3147)).

Report artifact (secrets redacted from ticket, raw JSON stays on Lacy's box):

- `$PAPERCLIP_SCRATCH_DIR/shipkit-gitleaks.json` (per-run scratch) or regenerate:
  ```bash
  gitleaks git --no-banner --report-format json --report-path /tmp/shipkit-gitleaks.json
  ```

## High-value findings (rotate first)

Anchored to commit `348add72` (2024-12-03) unless noted.

| Provider          | File(s)                                                 | Rule                     |
| ----------------- | ------------------------------------------------------- | ------------------------ |
| Anthropic         | env/.env.production, env/.env.local.off                 | anthropic-api-key        |
| OpenAI            | env/.env.production, env/.env.local.off                 | openai-api-key           |
| GCP               | env/.env.production, env/.env.local.off                 | gcp-api-key              |
| Discord           | env/.env.production, env/.env.local.off                 | discord-client-secret    |
| GitHub PAT        | env/.env.local.off                                      | github-pat               |
| Sentry            | env/.env.sentry-build-plugin, env/.env.local.off,       | sentry-org-token         |
|                   | .env.sentry-build-plugin (commit bd8a2224)              |                          |
| Private key       | env/.env.production, env/.env.local.off (1730-char PEM) | private-key              |
| Sourcegraph (x16) | .specstory/history/2025-06-\*.md (commit 8d4b036d)      | sourcegraph-access-token |
| Stripe            | .specstory/history/2025-06-17_22-55Z-\*.md              | stripe-access-token      |

Lower priority / triage: 36 JWTs, 177 generic-api-key hits (most in
`logflare.log`, `.repomix-output.txt`, `docs/waitlist.mdx`, `.env.example` —
mix of live-format tokens in log dumps and legitimate placeholders).

## Phase 1 — Rotate everything (blocks Phase 2)

Human action, per provider. Log rotations in this ticket as they land.

- [ ] Anthropic — revoke exposed key, mint new one, update deploy env
- [ ] OpenAI — revoke `sk-proj-…`
- [ ] GCP — regenerate API key, restrict by referrer/IP
- [ ] Discord — reset client secret on the OAuth app
- [ ] GitHub — revoke `ghp_…` PAT
- [ ] Sentry — rotate org auth token
- [ ] Sourcegraph — revoke the 16 exposed access tokens
- [ ] Stripe — verify `sk_test_` is test-mode only; rotate if any prod use
- [ ] Private key — regenerate keypair, deploy new pubkey wherever pinned
- [ ] Sweep audit logs (Anthropic + OpenAI + GCP + GitHub + Sentry) for use
      by unknown clients between commit date and rotation timestamp

## Phase 2 — History scrub (only after Phase 1 confirmed)

Prereq: every collaborator has pushed outstanding work, all open PRs merged or
rebased, downstream forks (bones, sink, TOH-new, lash-www, etc.) notified —
force-push rewrites SHAs and every downstream will need a re-clone or a rebase.

```bash
# 0. Full mirror clone to work on
git clone --mirror git@github.com:lacymorrow/shipkit.git shipkit-scrub.git
cd shipkit-scrub.git

# 1. Purge secret-bearing paths from history
git filter-repo \
  --path env/ --path .specstory/ \
  --path .env.sentry-build-plugin \
  --path .repomix-output.txt \
  --path logflare.log \
  --invert-paths

# 2. Redact any residual secret strings by value.
#    Build replacements.txt from the gitleaks report (one `LITERAL==>REDACTED`
#    per line). Regenerate the JSON on the mirror first so line numbers line up.
gitleaks git --no-banner --report-format json --report-path /tmp/leaks.json
# … generate replacements.txt from /tmp/leaks.json (script in scratchpad) …
git filter-repo --replace-text replacements.txt

# 3. Re-verify: should print `no leaks found`
gitleaks git --no-banner

# 4. Force-push (destructive — coordinate with all collaborators first)
git push --force --mirror
```

After push, every clone must be reset:

```bash
git fetch --all
git reset --hard origin/main
# or re-clone fresh
```

## Phase 3 — Prevent regression (this PR)

Landed on branch `security-gitleaks-hardening`:

- `.github/workflows/gitleaks.yml` — delta scan blocks PRs; weekly full-history
  scan is report-only until Phase 2 lands, at which point flip
  `continue-on-error: true` off on `scan-full-history`.
- `.githooks/pre-commit` — local `gitleaks protect --staged` gate.
- `package.json` postinstall — sets `core.hooksPath=.githooks` on install so
  contributors pick up the hook without a separate opt-in step.
- `.gitignore` — adds `.specstory/`, `.repomix-output.*`, `repomix-output.*`.

Follow-up (separate ticket): apply the same `.gitignore` additions and CI
workflow to every shipkit-family downstream (bones, sink, TOH-new, lash-www,
vibe.rehab).

## Verification checklist (post-scrub)

- [ ] `gitleaks git` on rewritten repo returns 0 leaks
- [ ] Force-push completed, all collaborators re-synced
- [ ] `.github/workflows/gitleaks.yml` full-history job set to blocking
- [ ] LAC-3147 (public flip) unblocked and re-evaluated
