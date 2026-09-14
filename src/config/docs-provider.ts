/*
 * Docs provider switch.
 *
 * Shipkit can serve its documentation from two different engines:
 *
 *   - "fumadocs" (default) — rendered in-app by the Next.js /docs route using
 *     fumadocs-mdx + fumadocs-core. Content lives in /docs as MDX.
 *
 *   - "holocron"  — rendered by a standalone Holocron site (docs-site/), which is
 *     a Vite/RSC app and therefore cannot be embedded in Next.js. In this mode the
 *     in-app /docs route steps aside and requests are proxied to the running
 *     Holocron server via a rewrite in next.config.ts.
 *
 * Both engines read the *same* MDX in /docs, so switching providers never
 * requires touching content.
 */

export const DOCS_PROVIDERS = ["fumadocs", "holocron"] as const;

export type DocsProvider = (typeof DOCS_PROVIDERS)[number];

export const DEFAULT_DOCS_PROVIDER: DocsProvider = "fumadocs";

/** Default Holocron dev server address (`bun run docs:holocron:dev`). */
export const DEFAULT_HOLOCRON_URL = "http://localhost:5173";

export function resolveDocsProvider(value: string | undefined): DocsProvider {
  return (DOCS_PROVIDERS as readonly string[]).includes(value ?? "")
    ? (value as DocsProvider)
    : DEFAULT_DOCS_PROVIDER;
}

/** Active docs provider, resolved from `DOCS_PROVIDER`. */
export const docsProvider = resolveDocsProvider(process.env.DOCS_PROVIDER);

export const isFumadocsProvider = docsProvider === "fumadocs";
export const isHolocronProvider = docsProvider === "holocron";

/**
 * Origin the Holocron site is served from. Only read when the provider is
 * "holocron"; Holocron has no static-export mode, so this must point at a
 * running Node/Workers deployment.
 */
export const holocronUrl = (process.env.DOCS_HOLOCRON_URL ?? DEFAULT_HOLOCRON_URL).replace(
  /\/$/,
  ""
);
