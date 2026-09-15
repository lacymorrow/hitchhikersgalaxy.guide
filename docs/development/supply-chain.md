---
title: Supply chain
description: How dependency upgrades and security advisories are handled, and who owns them.
---

# Supply chain

Shipkit is upstream of every site built from it, so its dependency tree is part
of the product. A flaw here is inherited by every downstream deployment, and a
fix here is worthless until it reaches them.

This page is the operating process. It exists because the failure mode is not
missing the problem. Four separate systems found the September 2026 advisories.
It is never closing it.

## The ranking rule

Severity alone is the wrong trigger. A critical in `vitest` browser mode never
reaches a user; a critical in the auth layer is the front door. Rank by
**reachability × exploitability**.

| Tier  | Test                                                                                                              | Clock                  |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **0** | Ships to production _and_ an outsider can reach it: auth bypass, injection, RCE, traversal, SSRF, deserialization | Same day               |
| **1** | Ships to production, but the impact is availability only                                                          | The next Monday window |
| **2** | Only ever executes on a developer machine or a build runner                                                       | Monthly sweep          |
| **3** | Moderate and low                                                                                                  | Recorded, never paged  |

Tier 2 is not "ignore it". A build runner holds deploy credentials and is a real
target; it just is not an emergency.

**A Tier 0 finding outranks whatever is on the board.** This is the only part of
the process that needs enforcing rather than scheduling. Without it, urgency
loses to roadmap and the queue refills.

## Running the triage

```bash
bun run audit:triage
```

This ranks the current tree and exits non-zero when anything is in Tier 0, so it
works as a gate. It re-checks every advisory against the version actually
installed, because `bun audit` does not. It will report a Next.js 15 advisory
against a Next.js 16 tree.

Use two sources and trust neither alone. GitHub's Dependabot alerts do proper
version-range matching against the dependency graph; `bun audit` catches
advisories GitHub has not indexed yet. In September 2026 GitHub reported 24
alerts here and `bun audit` found two more that GitHub did not list.

## The week

| When         | What                                                                                 | Owner     |
| ------------ | ------------------------------------------------------------------------------------ | --------- |
| Daily 07:00  | Scan every repo, rank, report only what is new                                       | automated |
| Monday 09:00 | The upgrade window: one batch, minors and patches together, majors one at a time     | DRI       |
| Monday 09:45 | Propagate upstream fixes to `shipkit-www` and client deployments                     | DRI       |
| First Monday | Tier 2 sweep, prune unused packages, unblock or cancel anything blocked over 14 days | DRI       |

The daily scan is `sh.lacy.supply-chain`. It stays silent unless a new critical
or high appeared, and files a board task assigned to the Security Engineer when
one does. A digest nobody reads is worse than silence.

Anything unmerged after two upgrade windows is either landed or explicitly
rejected with a reason on the ticket. Nothing sits in review quietly.

## The merge gate

```bash
bash scripts/verify.sh
```

Runs typecheck, lint, unit and node tests, a production build, and route smoke
checks, then prints a summary to paste into the PR. While GitHub Actions is
unavailable, a passing verify summary in the PR body **is** the gate.

Never merge a dependency bump without one. Eleven dependency PRs queued up in
September 2026 precisely because nothing required it, and two agents ended up
opening duplicates of each other's work.

## Compromise is not the same as vulnerability

A vulnerability is an honest bug with an advisory and a patch. A compromise is a
package that was taken over: a hijacked maintainer account, a typosquat, a
postinstall script added in a patch release. Dependabot will not catch it,
because at the moment it matters there is no advisory yet.

- Install scripts are denied by default. Keep `trustedDependencies` short and
  justified; every entry is a package allowed to execute code on install.
- Review lockfile changes on their own, never bundled into a feature PR. A
  one-line resolution change is how this arrives.
- Use `--frozen-lockfile` in CI and on every unattended install.
- Treat a dormant package publishing at an odd hour as suspicious until checked.

## Version constraints are part of the problem

In September 2026 `better-auth` sat on a critical for weeks with a patch
available. The range was `~1.5.6`, and a tilde cannot reach `1.6.11`. Nothing
was broken; the constraint was simply never revisited.

Pin exactly where you mean to pin, and write down why. A tilde or an exact pin
on a security-relevant package is a standing decision to not receive fixes, so
it needs a reason next to it.

## Overrides

Bun reads top-level `overrides` and `resolutions`. It does **not** read
`pnpm.overrides`. There is a `pnpm.overrides` block in `package.json` that has
never applied here; check the resolved version with
`node -e "console.log(require('./node_modules/<pkg>/package.json').version)"`
before believing an override took effect.
