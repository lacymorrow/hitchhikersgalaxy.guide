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
#   production                        -> build, always
#   preview/development + "[preview]" -> build
#   preview/development, no marker    -> skip
#   anything else, including unset    -> build  <- LAC-7080
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
#
# --- BEGIN CANONICAL POLICY (LAC-7080) -------------------------------------
# Everything below this line is BYTE-IDENTICAL on every repo that carries this
# guard, and scripts/test-vercel-ignore-step.sh pins its hash. Everything above
# is repo-specific context. Four whole-file variants of this script had drifted
# apart on main by 2026-11-05 and the test suite existed in three versions, so
# a case added in one repo did not exist in the others. The pin is what makes
# the next policy change have to land everywhere or go red.
#
# The 12 repos, measured 2026-11-05 by executing every live copy (LAC-7080):
#   ai-logical-fallacy-detector  aura-web   buildandserve   carolinasgps
#   cloud0.dev   hitchhikersgalaxy.guide   kinfolk   lash-www   linger
#   shipkit   shipkit-www   shipkit-io/bones
#
# Five repos set vercel.json ignoreCommand and are deliberately NOT in that
# list. Do not copy this block into them and do not copy theirs here:
#   photo-pods          parked, skips EVERY build including production, CEO
#                       ruling LAC-6903 decision 1(a). Removing its skip is
#                       step 1 of reviving the project.
#   townofharmony.org   same defect as this one, but its marker must be in the
#                       commit SUBJECT, not anywhere in the message. A
#                       deliberately stricter policy on a repo with a live
#                       client preview domain. Fixed separately.
#   shipkit-sink        a mirror of shipkit-www: identical commit history, no
#                       Vercel project linked, so this guard governs no build
#                       there. An independent commit would diverge from the
#                       mirror and be clobbered by the next sync.
#   coderev             opt-OUT policy (previews build unless [skip ci]). It
#   crocs-merch-chat    never had this defect: its fall-through already builds.
#                       Not yet on the LAC-7127 opt-in default; separate issue.
#
# UNKNOWN BUILDS, IT DOES NOT SKIP (LAC-7080).
# This guard used to decide production by one exact string comparison against
# VERCEL_ENV and then fall through to skip, so an unset, renamed or
# differently-cased VERCEL_ENV silently froze the production build. The live
# site then serves the previous deployment and the Vercel row reads CANCELED,
# which is indistinguishable from a deliberately parked project. The two costs
# are not symmetric: a needless preview build is about a minute of build CPU,
# a skipped production build is a stale client site that nothing reports.
#
# So an environment this script does not recognise BUILDS. To stop that from
# re-spending every preview minute if VERCEL_ENV ever stops being exported,
# the unknown path consults a second, independent signal first:
# VERCEL_GIT_PULL_REQUEST_ID. A production deploy never carries one, and 155
# of 155 preview deploys on these projects did (LAC-6380), so a PR id is safe
# positive evidence of a preview. VERCEL_GIT_COMMIT_REF was the other
# candidate and was rejected: using it means hardcoding this project's
# production branch into this file, and getting that one string wrong
# reintroduces exactly the production freeze this change exists to remove.
#
# There is exactly ONE `exit 0` below and it is the last statement. Every
# other path exits 1. The test asserts that structurally, because a second
# `exit 0` anywhere is a new silent-skip path.
set -eu

# Classify the deployment environment. Anything not positively recognised as
# non-production is production-class and must build.
case "${VERCEL_ENV:-}" in
  production)
    echo "VERCEL_ENV=production: building"
    exit 1
    ;;
  preview | development)
    # Known non-production. Fall through to the marker policy below.
    ;;
  *)
    # Unrecognised or unset. Only a second independent signal may downgrade
    # this to a preview; with no such signal, build (LAC-7080).
    if [ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]; then
      echo "VERCEL_ENV='${VERCEL_ENV:-}' unrecognised, but PR id '${VERCEL_GIT_PULL_REQUEST_ID}' is positive evidence of a preview: applying the preview policy"
    else
      echo "VERCEL_ENV='${VERCEL_ENV:-}' unrecognised and no PR id to prove this is a preview: building rather than risk a skipped production deploy (LAC-7080)"
      exit 1
    fi
    ;;
esac

# Vercel exports the commit message; fall back to git for a local run.
MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [ -z "$MSG" ]; then
  MSG="$(git log -1 --pretty=%B 2>/dev/null || true)"
fi

case "$MSG" in
  *"[preview]"*)
    echo "non-production + [preview] marker: building"
    exit 1
    ;;
esac

echo "non-production without the [preview] marker: skipping build"
exit 0
