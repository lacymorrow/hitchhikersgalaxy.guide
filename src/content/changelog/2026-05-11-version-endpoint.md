---
title: "Build Metadata via /api/version"
slug: "2026-05-11-version-endpoint"
description: "New API endpoint exposing build metadata — commit SHA, branch, build time, and package version."
publishedAt: "2026-05-11"
categories: ["Features", "Developer Experience"]
commitCount: 1
---

## /api/version Endpoint

A new `/api/version` route returns build-time metadata as JSON, useful for dashboards, deploy verification, and debugging.

### Response

```json
{
  "version": "0.6.0",
  "commit": "3d57de0b",
  "branch": "main",
  "buildTime": "2026-05-11T02:30:00Z",
  "nodeEnv": "production"
}
```

Values are injected at build time via `next.config.ts` environment variables (`NEXT_PUBLIC_BUILD_*`). Missing values default to `"unknown"`.
