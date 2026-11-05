#!/usr/bin/env bash
# Vercel "Ignored Build Step". Exit 0 = skip the build, exit 1 = build.
#
# THIS FILE IS THE AUTHORITY FOR THIS PROJECT'S BUILD-SKIP POLICY, and it only
# became the authority in LAC-7149. Before that it was dead code: vercel.json
# had no "ignoreCommand", so nothing in Vercel ever ran this file, and the
# project was governed the whole time by the fleet dependabot-only rule in the
# dashboard "Ignored Build Step" field. A script that is not named by
# vercel.json governs nothing and reads exactly like one that does. If you are
# auditing a project's policy, `grep ignoreCommand vercel.json` is the check;
# the presence of this file is not.
#
# The override runs the other way too: once vercel.json names this script, the
# dashboard field has no effect at all. Measured 2026-11-03 (LAC-6380), where a
# dashboard-only policy was written, read back as present, and silently ignored
# for 20 hours. Change the policy HERE.
#
# Policy (CEO ruling LAC-7127 decision 2a, 2026-11-05; landed LAC-7149).
# Preview builds are OPT-IN, on this project and on every other one:
#   production                       -> always build
#   preview, "[preview]" in message   -> build
#   anything else                     -> skip
#
# Production always builds. hitchhikersgalaxy.guide is a live property and a
# skipped production build would leave it on an older deployment after a merge.
# That is why VERCEL_ENV is tested first and why
# scripts/test-vercel-ignore-step.sh runs this file for real instead of reading
# it.
#
# This REPLACES a narrower opt-OUT policy that skipped only commits marked
# [skip ci] / [skip vercel] / [ci skip]. Those commits still skip, because they
# do not carry the opt-in marker either, so nothing that used to be skipped
# starts building. What changes is the default: an unmarked preview now skips
# as well. Preview builds on this project are cold
# (VERCEL_FORCE_NO_BUILD_CACHE), so each one is real quota.
#
# The match is a plain substring, so a commit that merely TALKS about the
# marker opts itself in. Worth knowing when you edit this file.
#
# To get a preview build, put [preview] anywhere in the commit message. No
# ticket and no approval needed. You can also redeploy from the Vercel
# dashboard, which bypasses this step entirely. If you already pushed without
# it, an empty commit with [preview] in the message is enough.
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "production: building"
  exit 1
fi

# Vercel exports the commit message; fall back to git for a local run.
MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [ -z "$MSG" ]; then
  MSG="$(git log -1 --pretty=%B 2>/dev/null || true)"
fi

case "$MSG" in
  *"[preview]"*)
    echo "preview + [preview] marker: building"
    exit 1
    ;;
esac

echo "preview without [preview] marker: skipping build"
exit 0
