#!/usr/bin/env bash
# Prove registry items install into a fresh Bones project.
#
#   bash scripts/registry-smoke.sh caching email        # these items
#   bash scripts/registry-smoke.sh --all                # every item in registry.json
#   REGISTRY_BUILD=1 bash scripts/registry-smoke.sh x   # also run `pnpm build` after typecheck
#
# What it does, per item: clone shipkit-io/bones (shallow), point @shipkit at a
# local copy of public/r served on a random port, `pnpm install` (shadcn only
# installs when an item brings a new package, and typecheck needs node_modules),
# `npx shadcn add @shipkit/<item> -y --overwrite` with stdin closed (no prompts),
# then `pnpm typecheck`.
# Needs Node 22 (Bones' .nvmrc) on PATH and pnpm.
set -euo pipefail
cd "$(dirname "$0")/.."

items=("$@")
if [[ "${1:-}" == "--all" ]]; then
  items=()
  while IFS= read -r name; do items+=("$name"); done < <(node -e 'for (const i of require("./registry.json").items) console.log(i.name)')
fi
[[ ${#items[@]} -gt 0 ]] || { echo "usage: registry-smoke.sh <item...> | --all" >&2; exit 2; }

work="$(mktemp -d)"
port=$((20000 + RANDOM % 20000))
npx --yes serve -l "$port" -n public/r >"$work/serve.log" 2>&1 &
serve_pid=$!
trap 'kill $serve_pid 2>/dev/null; rm -rf "$work"' EXIT
for _ in $(seq 1 20); do curl -fs "http://localhost:$port/registry.json" >/dev/null && break; sleep 0.5; done

pass=(); fail=()
for item in "${items[@]}"; do
  dir="$work/$item"
  echo "== $item"
  git clone -q --depth 1 https://github.com/shipkit-io/bones.git "$dir"
  node -e '
    const fs = require("fs"); const p = process.argv[1] + "/components.json";
    const c = JSON.parse(fs.readFileSync(p, "utf8"));
    c.registries = { "@shipkit": process.argv[2] };
    fs.writeFileSync(p, JSON.stringify(c, null, 2) + "\n");
  ' "$dir" "http://localhost:$port/{name}.json"
  if (cd "$dir" \
      && pnpm install --frozen-lockfile >"$work/$item.install.log" 2>&1 \
      && CI=1 npx --yes shadcn@latest add "@shipkit/$item" -y --overwrite </dev/null >"$work/$item.add.log" 2>&1 \
      && pnpm typecheck >"$work/$item.typecheck.log" 2>&1 \
      && { [[ -z "${REGISTRY_BUILD:-}" ]] || pnpm build >"$work/$item.build.log" 2>&1; }); then
    echo "   ok"; pass+=("$item")
  else
    echo "   FAIL (logs: $work/$item.*.log)"; tail -20 "$work/$item".*.log; fail+=("$item")
    trap - EXIT # keep the logs
  fi
done

echo; echo "passed: ${pass[*]:-none}"; echo "failed: ${fail[*]:-none}"
[[ ${#fail[@]} -eq 0 ]]
