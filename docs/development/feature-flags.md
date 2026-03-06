---
title: "Feature Flags"
description: "How Shipkit's build-time feature detection works."
---

# Feature Flags

Shipkit detects which features are available at build time by checking environment variables. No manual flag configuration needed — set the env vars for a feature and it turns on.

## How It Works

`src/config/features-config.ts` runs during build. It:

1. Checks which env vars are present
2. Sets `buildTimeFeatures.FEATURE_NAME = true/false`
3. Generates `NEXT_PUBLIC_FEATURE_*` flags for client-side checks
4. Only enabled flags are injected (disabled = `undefined`, not `false`)

## Usage

### Client-side

```typescript
import { env } from "@/env";

if (env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
  // only runs when Stripe env vars are set
}
```

### Build-time (Next.js config, plugins)

```typescript
import { buildTimeFeatures } from "@/config/features-config";

if (buildTimeFeatures.PAYLOAD_ENABLED) {
  // configure Payload plugin
}
```

## Env Var Mirroring

Shipkit auto-mirrors server-side public keys to `NEXT_PUBLIC_` variants at build time. You can set:

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

And `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` will be generated automatically. Only whitelisted keys are mirrored (see `PUBLIC_ENV_BASE_KEYS` in `features-config.ts`).

Mirrored keys: `BUILDER_API_KEY`, `CLERK_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_PUBLISHABLE_KEY`, `POSTHOG_KEY`, `UMAMI_WEBSITE_ID`, `DATAFAST_WEBSITE_ID`, `DATAFAST_DOMAIN`, `STATSIG_CLIENT_KEY`, `GOOGLE_ANALYTICS_ID`, `GOOGLE_GTM_ID`, `C15T_URL`, `VERCEL_INTEGRATION_SLUG`.

## APP_SECRET Derivation

If `APP_SECRET` is set, secrets like `PAYLOAD_SECRET` and `BETTER_AUTH_SECRET` are treated as satisfied — they derive from the master secret. One env var, multiple features.

## Complete Flag Reference

### Core

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `DATABASE_ENABLED` | `DATABASE_URL` set | — |
| `PAYLOAD_ENABLED` | Database + `PAYLOAD_SECRET` (or `APP_SECRET`) | `DISABLE_PAYLOAD=true` |
| `BUILDER_ENABLED` | `NEXT_PUBLIC_BUILDER_API_KEY` set | `DISABLE_BUILDER=true` |
| `MDX_ENABLED` | Always (default on) | `DISABLE_MDX=true` |
| `PWA_ENABLED` | Always (default on) | `DISABLE_PWA=true` |
| `DEVTOOLS_ENABLED` | `ENABLE_DEVTOOLS=true` | — |

### Authentication

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `AUTH_JS_ENABLED` | Any Auth.js provider enabled | — |
| `BETTER_AUTH_ENABLED` | `BETTER_AUTH_SECRET` (or `APP_SECRET`) | `DISABLE_BETTER_AUTH=true` |
| `AUTH_CLERK_ENABLED` | `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | `DISABLE_AUTH_CLERK=true` |
| `AUTH_STACK_ENABLED` | `STACK_PROJECT_ID` + `STACK_PUBLISHABLE_CLIENT_KEY` + `STACK_SECRET_SERVER_KEY` | `DISABLE_AUTH_STACK=true` |
| `SUPABASE_AUTH_ENABLED` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` | `DISABLE_SUPABASE_AUTH=true` |
| `AUTH_GUEST_ENABLED` | `ENABLE_AUTH_GUEST=true` | — |
| `AUTH_CREDENTIALS_ENABLED` | Payload enabled | `DISABLE_AUTH_CREDENTIALS=true` |
| `AUTH_RESEND_ENABLED` | `RESEND_API_KEY` (dev only) | `DISABLE_AUTH_RESEND=true` |
| `AUTH_GITHUB_ENABLED` | `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | `DISABLE_AUTH_GITHUB=true` |
| `AUTH_GOOGLE_ENABLED` | `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | `DISABLE_AUTH_GOOGLE=true` |
| `AUTH_DISCORD_ENABLED` | `AUTH_DISCORD_ID` + `AUTH_DISCORD_SECRET` | `DISABLE_AUTH_DISCORD=true` |
| `AUTH_TWITTER_ENABLED` | `AUTH_TWITTER_ID` + `AUTH_TWITTER_SECRET` | `DISABLE_AUTH_TWITTER=true` |
| `AUTH_GITLAB_ENABLED` | `AUTH_GITLAB_ID` + `AUTH_GITLAB_SECRET` | `DISABLE_AUTH_GITLAB=true` |
| `AUTH_BITBUCKET_ENABLED` | `AUTH_BITBUCKET_ID` + `AUTH_BITBUCKET_SECRET` | `DISABLE_AUTH_BITBUCKET=true` |
| `AUTH_VERCEL_ENABLED` | `VERCEL_CLIENT_ID` + `VERCEL_CLIENT_SECRET` | `DISABLE_AUTH_VERCEL=true` |
| `AUTH_ENABLED` | Any auth provider enabled | — |

### Payments

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `LEMONSQUEEZY_ENABLED` | `LEMONSQUEEZY_API_KEY` + `LEMONSQUEEZY_STORE_ID` | `DISABLE_LEMONSQUEEZY=true` |
| `STRIPE_ENABLED` | `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` | `DISABLE_STRIPE=true` |
| `POLAR_ENABLED` | `POLAR_ACCESS_TOKEN` | `DISABLE_POLAR=true` |

### Storage

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `S3_ENABLED` | `AWS_REGION` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_BUCKET_NAME` | `DISABLE_S3=true` |
| `VERCEL_BLOB_ENABLED` | `VERCEL_BLOB_READ_WRITE_TOKEN` | `DISABLE_VERCEL_BLOB=true` |
| `FILE_UPLOAD_ENABLED` | S3 or Vercel Blob enabled | — |

### Analytics

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `POSTHOG_ENABLED` | `POSTHOG_KEY` | `DISABLE_POSTHOG=true` |
| `UMAMI_ENABLED` | `UMAMI_WEBSITE_ID` | `DISABLE_UMAMI=true` |
| `DATAFAST_ENABLED` | `DATAFAST_WEBSITE_ID` | `DISABLE_DATAFAST=true` |
| `STATSIG_ENABLED` | `STATSIG_CLIENT_KEY` | `DISABLE_STATSIG=true` |
| `GOOGLE_ANALYTICS_ENABLED` | `GOOGLE_ANALYTICS_ID` | `DISABLE_GOOGLE_ANALYTICS=true` |
| `GOOGLE_TAG_MANAGER_ENABLED` | `GOOGLE_GTM_ID` | `DISABLE_GOOGLE_TAG_MANAGER=true` |

### Infrastructure

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `REDIS_ENABLED` | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | `DISABLE_REDIS=true` |
| `VERCEL_API_ENABLED` | `VERCEL_ACCESS_TOKEN` | `DISABLE_VERCEL_API=true` |
| `VERCEL_INTEGRATION_ENABLED` | `VERCEL_INTEGRATION_SLUG` + `VERCEL_CLIENT_ID` + `VERCEL_CLIENT_SECRET` | `DISABLE_VERCEL_INTEGRATION=true` |

### AI / External Services

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `OPENAI_ENABLED` | `OPENAI_API_KEY` | `DISABLE_OPENAI=true` |
| `ANTHROPIC_ENABLED` | `ANTHROPIC_API_KEY` | `DISABLE_ANTHROPIC=true` |
| `GITHUB_API_ENABLED` | `GITHUB_ACCESS_TOKEN` | `DISABLE_GITHUB_API=true` |

### Other

| Flag | Enabled when | Disable with |
|------|-------------|-------------|
| `LIGHT_MODE_ENABLED` | Always (default on) | `DISABLE_LIGHT_MODE=true` |
| `DARK_MODE_ENABLED` | Always (default on) | `DISABLE_DARK_MODE=true` |
| `C15T_ENABLED` | `C15T_URL` | `DISABLE_C15T=true` |
| `CONSENT_MANAGER_ENABLED` | C15T or `ENABLE_CONSENT_MANAGER=true` | `DISABLE_CONSENT_MANAGER=true` |
| `TURNSTILE_ENABLED` | `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | — |

## Adding a New Feature Flag

1. Add detection in `src/config/features-config.ts`:

```typescript
buildTimeFeatures.MY_FEATURE_ENABLED =
  hasEnv("MY_API_KEY") && !envIsTrue("DISABLE_MY_FEATURE");
```

2. Add the env var to `src/env.ts` for type safety.
3. Use `env.NEXT_PUBLIC_FEATURE_MY_FEATURE_ENABLED` client-side or `buildTimeFeatures.MY_FEATURE_ENABLED` at build time.

## Key Files

| File | Purpose |
|------|---------|
| `src/config/features-config.ts` | Feature detection + flag generation |
| `src/env.ts` | T3 Env schema (runtime validation) |
