# Vercel Deployment Checks

ShipKit includes a GitHub Actions workflow that health-checks every Vercel deployment before it goes live. If the deployed app returns a 500, the old production stays up and the broken deploy never gets promoted.

## How It Works

1. Vercel builds and deploys to a preview URL
2. GitHub Actions triggers on `deployment_status`
3. The workflow curls the preview URL and checks for 5xx errors
4. It reports a commit status (`Deployment Check: Health`) back to GitHub
5. Vercel only promotes to production if the check passes

## Setup

### 1. Enable Protection Bypass for Automation

Preview deployments are behind Vercel Authentication by default. The health check needs to bypass this to actually test the page.

1. Go to your Vercel project **Settings > Deployment Protection**
2. Enable **Protection Bypass for Automation**
3. Copy the generated secret

### 2. Add the Secret to GitHub

1. Go to your GitHub repo **Settings > Secrets and variables > Actions**
2. Add a new repository secret:
   - Name: `VERCEL_AUTOMATION_BYPASS_SECRET`
   - Value: the secret from step 1

### 3. Enable Deployment Checks in Vercel

1. Go to your Vercel project **Settings > Deployment Checks**
2. Select **Deployment Check: Health** from the dropdown
3. Save

> **Note:** The workflow must exist on your `main` branch before it appears in the Vercel dropdown. If you don't see it, push a commit to `main` and trigger a deployment first.

## Graceful Degradation

ShipKit is a boilerplate, so everything degrades gracefully:

| Scenario | Behavior |
|---|---|
| **Not on Vercel** | Workflow never triggers (no `deployment_status` events) |
| **No bypass secret** | Health check passes 401 (auth) as non-5xx; logs a warning |
| **With bypass secret** | Full health check — catches 500s on protected previews |
| **Deployment Checks not enabled** | Workflow runs and reports status, but Vercel doesn't gate on it |

## Files

- `.github/workflows/deployment-check.yml` — the health check workflow
- `scripts/smoke-test.ts` — build-time smoke test (separate layer, runs during `build:vercel`)

## Troubleshooting

### "Resource not accessible by integration"

The workflow needs `statuses: write` permission on the GitHub token. This is already set in the workflow file. If you're using a custom token, make sure it has the `repo:status` scope.

### Health check passes but Vercel doesn't promote

Make sure you've selected "Deployment Check: Health" in Vercel project Settings > Deployment Checks. The check name must match exactly.

### Workflow doesn't trigger

The `deployment_status` event only triggers workflows on the default branch (`main`). Make sure the workflow file has been merged to `main`.
