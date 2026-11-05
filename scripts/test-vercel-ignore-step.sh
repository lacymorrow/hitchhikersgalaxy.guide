#!/usr/bin/env bash
# Regression test for scripts/vercel-ignore-step.sh (LAC-7149).
#
# Convention under test: exit 0 = SKIP the build, exit 1 = BUILD.
# The policy is opt-in previews (CEO ruling LAC-7127 decision 2a).
#
# There are two defects worth a test here and they are not symmetric. Building
# every preview costs money. Skipping a PRODUCTION build takes
# hitchhikersgalaxy.guide off the latest deployment after a merge, so the
# production arms run first and the mutant control below exists to prove they
# can actually fail.
#
# The arms for [skip ci] are not decoration. This policy replaced an opt-OUT
# rule that skipped exactly those commits, and the upstream shipkit sync still
# writes them, so "nothing that used to be skipped starts building" is a
# property worth holding.
#
# Run: bash scripts/test-vercel-ignore-step.sh
#      bash scripts/test-vercel-ignore-step.sh --mutant   # must report failures
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
MUTANT=0
[ "${1:-}" = "--mutant" ] && { MUTANT=1; shift; }
SUT="${1:-$HERE/vercel-ignore-step.sh}"
SANDBOX="$(mktemp -d)"   # not a git repo, so the git fallback cannot leak HEAD
trap 'rm -rf "$SANDBOX"' EXIT

if [ "$MUTANT" -eq 1 ]; then
  # The one change to this file that could freeze production: skip everything.
  printf '#!/usr/bin/env bash\nexit 0\n' > "$SANDBOX/mutant.sh"
  SUT="$SANDBOX/mutant.sh"
fi

pass=0; fail=0

# check <desc> <want_rc> <VERCEL_ENV> <VERCEL_GIT_COMMIT_MESSAGE>
check() {
  local desc="$1" want="$2" venv="$3" msg="$4" got
  ( cd "$SANDBOX" && env -i PATH="$PATH" HOME="$SANDBOX" \
      VERCEL_ENV="$venv" VERCEL_GIT_COMMIT_MESSAGE="$msg" \
      bash "$SUT" ) >/dev/null 2>&1
  got=$?
  if [ "$got" -eq "$want" ]; then
    pass=$((pass+1)); printf '  ok    %s (rc=%s)\n' "$desc" "$got"
  else
    fail=$((fail+1)); printf '  FAIL  %s (want rc=%s, got rc=%s)\n' "$desc" "$want" "$got"
  fi
}

echo "testing: $SUT"

# BUILD (rc=1). Production first: these are the client-facing arms.
check "production always builds"                      1 production "chore: routine"
check "production builds with no commit message"      1 production ""
check "production ignores [preview]"                  1 production "feat: x [preview]"
check "production builds a dependabot bump"           1 production "chore(deps): bump next"
check "preview with [preview] builds"                 1 preview    "feat: x [preview]"
check "preview with [preview] mid-message builds"     1 preview    "fix: a [preview] trailing words"
check "preview with [preview] on its own line builds" 1 preview    "fix: a

[preview]"

# SKIP (rc=0)
check "plain preview skips"                           0 preview    "fix(db): drop the dev-only TLS bypass"
check "preview with empty message skips"              0 preview    ""
check "dependabot-style preview skips"                0 preview    "chore(deps): bump marked from 17 to 18"
check "prettier-sweep preview skips"                  0 preview    "style: prettier --write on 80 files"
check "legacy [skip ci] preview still skips"          0 preview    "chore: sync [skip ci]"
check "legacy [skip vercel] preview still skips"      0 preview    "chore: sync [skip vercel]"
check "legacy [ci skip] preview still skips"          0 preview    "chore: sync [ci skip]"
check "near-miss marker does not build"               0 preview    "feat: preview of the new page"
check "bracketless preview word does not build"       0 preview    "feat: add preview mode"
check "capitalised [Preview] does not build"          0 preview    "feat: x [Preview]"
check "unset VERCEL_ENV is treated as not-production" 0 ""         "fix: something"

# A commit message is attacker-ish input only in the sense that it is free text
# written by whoever pushed. It must not be evaluated.
check "command substitution in message is inert"      0 preview    'fix: $(touch pwned) thing'
check "backticks in message are inert"                0 preview    'fix: `id` thing'
if [ -e "$SANDBOX/pwned" ]; then
  fail=$((fail+1)); printf '  FAIL  commit message was evaluated\n'
else
  pass=$((pass+1)); printf '  ok    commit message was not evaluated\n'
fi

echo "  -- $pass passed, $fail failed"

if [ "$MUTANT" -eq 1 ]; then
  if [ "$fail" -gt 0 ]; then
    echo "  mutant control OK: an always-skip step was caught by $fail arms"
    exit 0
  fi
  echo "  MUTANT CONTROL FAILED: these arms pass a step that skips production"
  exit 1
fi

[ "$fail" -eq 0 ] || exit 1
