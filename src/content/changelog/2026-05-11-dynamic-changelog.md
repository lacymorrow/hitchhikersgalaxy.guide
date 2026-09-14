---
title: "Dynamic Changelog with Markdown Fallback"
slug: "2026-05-11-dynamic-changelog"
description: "Changelog now reads from markdown files when present, falling back to GitHub commit history for downstream repos."
publishedAt: "2026-05-11"
categories: ["Features", "Infrastructure"]
commitCount: 1
---

## Markdown-First Changelog

The changelog page now checks for `.md` / `.mdx` files in `src/content/changelog/` before falling back to the GitHub API.

### How It Works

1. If markdown files exist in `src/content/changelog/`, those are used as changelog entries
2. If no markdown files exist, the changelog is auto-generated from the repo's GitHub commits and tags

This means downstream ShipKit sites get an automatic changelog from their repo's commit history out of the box, while sites that need curated entries can drop markdown files into the content directory.

### Markdown Format

```markdown
---
title: "Entry Title"
slug: "2026-05-11-my-feature"
description: "Short summary for the timeline view."
publishedAt: "2026-05-11"
categories: ["Features"]
commitCount: 3
---

Full markdown content here.
```
