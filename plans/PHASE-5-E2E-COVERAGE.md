# Phase 5 — E2E coverage of critical user flows

> **Status**: DRAFT — execute after Phase 4 (characterization tests) lands.
> **Authored**: 2026-06-24.

Phase 4 covers unit-level safety nets. Phase 5 makes the actual product
flows verifiable end-to-end. Playwright is already wired up
(`tests/e2e/`); the work is making the specs run, not setting up the
framework.

## Definition of done

`bun run test:e2e` exits 0 with every spec executing (no `test.skip` left
due to missing env vars). `bun run test:browser` also green.

## Current state (baseline)

- `tests/e2e/login.spec.ts` — uses `test.skip(!hasForm, "Credentials auth
not enabled")` and `test.skip(!loggedIn, "Login failed")`. Both skip
  unless `AUTH_SECRET` and `NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED`
  are set.
- `tests/e2e/full-deploy-flow.spec.ts` — skips unless deploy env vars
  (`VERCEL_TOKEN`, `GITHUB_ACCESS_TOKEN`, etc.) are set.
- Various `shipkit-regression.spec.ts` cases test public pages only.

## Deliverables

### 1. Local-dev test env

Create `.env.test` (gitignored) and a `tests/e2e/env-setup.ts` that loads
it. Defines:

```
AUTH_SECRET=ci-only-secret
NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED=true
NEXT_PUBLIC_FEATURE_AUTH_ENABLED=true
NEXT_PUBLIC_FEATURE_DATABASE_ENABLED=true
DATABASE_URL=<from Testcontainers — Phase 3>
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test1234!
```

### 2. Critical-flow specs

Add or extend e2e specs covering:

1. **Sign-up + sign-in (credentials)**:
   - Sign up new user → email verification path (mock or skip if magic-link)
   - Sign in with credentials → land on dashboard
2. **Sign-in with magic link** (if `NEXT_PUBLIC_FEATURE_AUTH_MAGIC_LINK_ENABLED`):
   - Use Mailpit or a test SMTP catcher; capture the link.
3. **Subscribe / checkout** (sandbox mode):
   - Lemon Squeezy test mode if the test secret is available.
   - Stripe test mode otherwise.
   - Verify the resulting payment record lands in the test DB.
4. **Webhook receipt** (relates to plans 002, 004, 005):
   - POST the provider's sample payload signed with the test secret.
   - Verify idempotent insert (re-post same payload, expect single row).
   - Verify the `custom_data.user_id` rejection path (plan 002).
5. **Admin dashboard**:
   - Login as admin → reach `/admin` → confirm users list renders.
6. **Multi-zone navigation** (only if zones are deployed):
   - Anchor-tag navigation between `/`, `/docs`, `/blog`.

### 3. Reliability fixes

- Replace `await page.waitForTimeout(...)` with proper waits (`waitForSelector`,
  `waitForResponse`, etc.). Audit existing specs.
- Use Playwright's `expect.poll` for flaky DB-read assertions.
- Add `--retries=2` only in CI; locally retries should be 0 to catch
  flakes early.

### 4. CI integration

The draft workflow at `plans/draft-ci-workflow.yml` already includes a
Playwright job. After Phase 6 lands, e2e runs on every PR. Until then,
e2e is local-only.

## Verification gate

```bash
bun run test:e2e        # 0 failures, 0 skipped
bun run test:browser    # 0 failures
```

## STOP conditions

- Playwright can't install browsers locally (Linux/Mac driver issue).
  Investigate before proceeding.
- A flow fails because the SERVER has a real bug (not the test). File
  it as a separate issue; don't paper over with `.skip`.
- Auth fails because of session/cookie domain issues in headless
  Chromium. Standard Playwright config tweak (`baseURL`, `storageState`).

## Open question

- E2E for payment webhooks: do we hit a real provider sandbox (slower,
  network-dependent, but exercises real signature verification) or sign
  payloads ourselves with the test secret (faster, deterministic, but
  the signature scheme could drift from the live one)? **Recommendation:
  start with self-signed payloads in unit tests (Phase 4) and self-signed
  in e2e too; add a separate `tests/integration/` suite later that hits
  real sandboxes weekly.**
