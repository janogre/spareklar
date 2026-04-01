# Spareklar — Deployment Runbook

## Stack

- **Platform:** Vercel (Hobby or Pro)
- **Framework:** Next.js 14 (App Router)
- **Node.js:** 20.x
- **Region:** fra1 (Frankfurt) — closest to Norway

---

## First-time Vercel Setup

### Option A: CLI deploy (fastest for MVP)

```bash
npm i -g vercel
vercel login
vercel link          # links local folder to Vercel project
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel --prod
```

### Option B: GitHub integration (recommended for ongoing dev)

1. Push repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (repo root)
5. Build command: `npm run build` (default)
6. Output dir: `.next` (default)
7. Node.js version: `20.x` (Settings → General)
8. Add env var: `ANTHROPIC_API_KEY` → production value → mark secret → scope: Production + Preview

---

## Environment Variables

| Variable | Required | Scope | Notes |
|----------|----------|-------|-------|
| `ANTHROPIC_API_KEY` | Yes | Production + Preview | Mark as secret. Never commit. |

No other env vars are required for MVP.

---

## GitHub Secrets (for CI/CD workflows)

Add these in GitHub repo → Settings → Secrets → Actions:

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |
| `ANTHROPIC_API_KEY` | console.anthropic.com/settings/keys |

---

## Post-deploy Verification

### 1. Check the app loads

```
https://your-deployment.vercel.app/
```

### 2. Test `/api/analyze`

```bash
curl -X POST https://your-deployment.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"inputType":"text","data":"Lønn: 50000 NOK. Strøm: 2500 NOK/måned. Netflix: 189 NOK/måned. Mobil: 599 NOK/måned."}'
```

Expected: JSON with `totalEstimatedSavingsNOK` and `recommendations[]`.

### 3. Check function timeout

In Vercel dashboard → project → Functions tab, confirm `api/analyze` shows max duration 60s.

### 4. Verify no API key in logs

In Vercel dashboard → project → Functions → Logs, scan output for `sk-ant-` — should be zero matches.

---

## Domain Setup (post-MVP)

1. Register `spareklar.no` (if not done)
2. Vercel dashboard → project → Settings → Domains → Add domain
3. Point CNAME `spareklar.no` → `cname.vercel-dns.com`
4. Or use Vercel nameservers for automatic TLS

For MVP launch: use the provided `*.vercel.app` URL.

---

## Preview Deploys

Every PR automatically gets a unique preview URL:
```
https://spareklar-git-<branch-name>-<team>.vercel.app
```

Share this format with QA when handing off. Each preview deploy has the `ANTHROPIC_API_KEY` env var injected from Vercel settings (Preview scope).

---

## Rollback

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

Or in Vercel dashboard: Deployments → find previous deploy → ⋯ → Promote to Production.
