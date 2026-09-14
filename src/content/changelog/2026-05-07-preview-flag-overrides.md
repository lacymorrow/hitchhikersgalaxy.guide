---
title: "Preview Feature Flag Overrides via Query Params"
slug: "2026-05-07-preview-flag-overrides"
description: "Enable or disable feature flags at runtime using URL query parameters — no redeploy needed."
publishedAt: "2026-05-07"
categories: ["Features", "Developer Experience"]
commitCount: 3
---

## Feature Flag Query-Param Overrides

You can now toggle any feature flag at runtime without redeploying by hitting the new `/api/flags` route.

### Usage

```
/api/flags?feature_flag_database=1&feature_flag_mdx=0
```

Overrides are stored in a short-lived cookie (`_shipkit_preview`, 8 hours) and merged with your existing flags on every request.

### Parameters

| Param                   | Effect                                                    |
| ----------------------- | --------------------------------------------------------- |
| `feature_flag_<name>=1` | Enable the named flag                                     |
| `feature_flag_<name>=0` | Disable the named flag                                    |
| `clear=1`               | Remove all overrides                                      |
| `redirect=<path>`       | Redirect to `<path>` after applying (internal paths only) |
| `token=<secret>`        | Required when `PREVIEW_SECRET` is set in env              |

### Security

- When `PREVIEW_SECRET` is set, a matching `token` query param is required — unauthenticated requests return `401`.
- Cookie flag names are validated against the allowlist of known `featureFlagNames`; unknown keys are silently dropped.
- Redirect targets must be same-origin paths; external URLs are rewritten to `/`.
- Cookie payload is capped at 2 KB to prevent overflow abuse.
