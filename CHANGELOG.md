# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

## v0.2.2 - 2026-05-15

- feat: add /api/version endpoint exposing build version, commit SHA, and buildTime metadata ([LAC-842])
- fix(seo): prevent noindex leak onto /docs pages from CMS catch-all route
- fix(seo): fix canonical URLs and remove noindex pages from sitemap
- fix(auth): wrap OAuthButtons in Suspense to prevent stuck loading state
- fix(theme): derive HolyLoader colors from CSS theme variables
- fix(sitemap): add changelog entries and index page to sitemap
- fix(blog): sort posts by publishedAt descending so newest appear first
- fix(changelog): fix stale cache and dynamic rendering issues
- docs: add hero banner and screenshots to README

## v0.2.1 - 2025-09-23

- Maintenance: version bump to align internal `shipkit.bones`
- Various improvements and docs updates since last tag

Previous tag: v2.1.1 (monorepo tag history)
