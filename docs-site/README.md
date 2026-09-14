# Shipkit docs — Holocron build

A standalone [Holocron](https://holocron.so/) build of the Shipkit documentation,
kept as the alternative to the default in-app fumadocs renderer.

It reads the **same** MDX from `../docs` (via `pagesDir` in `vite.config.ts`), so
there is no second copy of the content to keep in sync. `docs.jsonc` is generated
from that tree by `scripts/generate-holocron-nav.mjs` and is gitignored.

## Run it

```bash
cd docs-site
npm install
npm run dev     # http://localhost:5173
```

To serve it at `/docs` on the main app, point Shipkit at it:

```bash
DOCS_PROVIDER=holocron DOCS_HOLOCRON_URL=http://localhost:5173 bun dev
```

`next.config.ts` then rewrites `/docs` and `/docs/*` to this server and the
in-app fumadocs route stands down. See `src/config/docs-provider.ts`.

## Deploying

Holocron has **no static-export mode** — `vite build` emits an RSC server
(`dist/rsc/index.js`), so it needs a Node or Cloudflare Workers runtime:

```bash
npm run build
npm start        # node dist/rsc/index.js
```

Set `DOCS_HOLOCRON_URL` to that deployment's origin.

## Status

Both `npm run dev` and `npm run build` are green — 0 broken links, 0 broken
assets, 0 MDX errors across all 74 pages.

Holocron link-checks the content at build time, which fumadocs does not. That
check earned its keep: it found 15 genuinely broken links (`/contributing`,
`/integrations/infrastructure/aws-s3`, `/reference/snippets`, ...) that had been
broken silently under fumadocs. They are fixed. Worth re-running this build
after any docs change even if you ship the fumadocs provider.

## Caveats

- **Shipkit's app-wired MDX components do not exist here.** Holocron renders MDX
  with its own component set, so `<SiteName />`, `<SecretGenerator />`,
  `<AskAiButtons />` and `<FileTree />` will not resolve. No doc uses them today
  — keep it that way, or the holocron provider breaks.
- **Internal notes live in `docs-internal/`, not `docs/`.** Everything under
  `docs/` is published by both providers.
- Holocron is single-maintainer and pre-1.0, and this build is a required CI
  gate, so `@holocron.so/vite` is pinned to an exact version. Bump it
  deliberately.
