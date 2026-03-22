# Infrastructure Guide

## Current Stack

| Layer | Service | Why |
|---|---|---|
| Database | **Neon PostgreSQL** (serverless) | Auto-scales compute, connection pooler built-in, free tier generous, branches for staging |
| Cache | **Upstash Redis** (optional) | Serverless per-request pricing, free tier ~10k req/day, TLS, compatible with ioredis |
| Server | **Node.js + Express** | Deployed to Railway or Render |
| Auth | JWT (bcryptjs + jsonwebtoken) | Stateless, no session storage needed |
| External APIs | Google Places API (New) | Photo proxy in `/api/photo` keeps key off client |

---

## Why Neon over Supabase (current stage)

Neon and Supabase both run PostgreSQL. For this app right now:

- **Schema is already on Neon** — migration would require data export + re-import
- **Neon's connection pooler** (PgBouncer-compatible) handles connection spikes from serverless deploys
- **Neon branches** let you create an instant copy of prod data for staging/testing
- Supabase adds value when you need built-in auth, storage, or Realtime websockets — none of which this app currently uses

**When to migrate to Supabase:**
- You want Realtime (live group preference updates without polling)
- You want Supabase Storage for user-uploaded content (profile photos, custom restaurant images)
- You want Row Level Security enforced at the DB layer rather than in middleware

---

## Database: Neon Setup

### Connection strings
Use the **pooled** connection string (ends with `-pooler.region.aws.neon.tech`) for the app server.  
Use the **direct** connection string for migrations (`node db/migrate.js`).

### Running migrations
```bash
# See what's pending without applying
npm run migrate:dry

# Apply all pending migrations
npm run migrate

# Add a new migration
# Create: server/db/migrations/003_my_change.sql
# Then run: npm run migrate
```

Migrations are tracked in `schema_migrations` table. Never edit or delete a migration file after it has been applied to any environment.

### Neon branches (staging workflow)
```bash
# Create a staging branch from main (instant — no data copy needed)
# via Neon Console → Branches → Create branch from main

# Point staging server at the branch connection string
DATABASE_URL=postgresql://...@ep-staging-branch.neon.tech/neondb
```

---

## Cache: Upstash Redis

Redis is **optional** — the app works without it (every request hits Google Places API). Adding Upstash reduces Google API costs and cuts recommendations latency from ~800 ms to ~50 ms on cache hits.

### Setup (5 minutes)
1. Create a free account at [upstash.com](https://upstash.com)
2. Create a new Redis database → select the same region as your server (e.g. `us-east-1`)
3. Copy the **Redis URL** (`rediss://default:...@...upstash.io:6379`)
4. Add to your environment: `REDIS_URL=rediss://...`

### What gets cached
| Cache key | TTL | Why |
|---|---|---|
| `places:{query}` | 1 hour | Restaurant search results per cuisine+location query |
| `geocode:{location}` | 24 hours | City/neighbourhood coordinates change rarely |

### Free tier limits
- 10,000 requests/day — enough for ~500 recommendation fetches/day
- 256 MB storage — more than sufficient for JSON restaurant data
- Upgrade to Pay-as-you-go when daily requests consistently exceed 10k

---

## Deployment: Railway

Railway is the recommended host for this Express server.

### First deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and init
railway login
railway init        # link to a new Railway project
railway up          # deploy current directory
```

### Environment variables
Set these in Railway Dashboard → Variables (never in code):
```
DATABASE_URL=<neon pooled connection string>
JWT_SECRET=<output of: openssl rand -hex 64>
JWT_EXPIRES_IN=7d
GOOGLE_PLACES_API_KEY=<from Google Cloud Console>
FRONTEND_URL=https://your-app.vercel.app
REDIS_URL=<from Upstash console>        # optional
NODE_ENV=production
LOG_LEVEL=info
```

### Health check
Railway uses `/health` (configured in `railway.toml`) to verify the container is up before routing traffic.

### Scaling
- **Vertical:** Upgrade Railway plan to increase RAM/CPU per replica
- **Horizontal:** Set replica count > 1 in Railway dashboard; the app is stateless so this works automatically
- **DB connections:** Each replica uses up to 10 PG connections (`max` in `config/database.js`). With 3 replicas = 30 connections — well within Neon's paid plan limits. Adjust `max` accordingly.

---

## Alternative Hosts

| Host | Notes |
|---|---|
| **Render** | Free tier available; uses `Procfile` (already included). Add env vars in Render dashboard. |
| **Fly.io** | Better for multi-region; run `fly launch` in the server directory |
| **AWS App Runner** | Container-based; add a `Dockerfile` if needed |

---

## Logging

Logs are structured JSON in production (parseable by Railway, Datadog, Logtail, etc.) and pretty-printed in development.

### Log levels
Set `LOG_LEVEL` env var: `debug` | `info` | `warn` | `error` (default: `info`)

### Integrations
- **Railway** — streams stdout logs automatically, searchable in the dashboard
- **Logtail** (Better Stack) — free tier log aggregation; pipe Railway logs via their drain URL
- **Datadog / Sentry** — add the relevant pino transport when ready for production error tracking

---

## Scaling Checklist

| Milestone | Action |
|---|---|
| 0 → 100 users | Current setup handles this with no changes |
| 100 → 1,000 users | Add Upstash Redis; upgrade Neon to paid plan (more connections) |
| 1,000 → 10,000 users | Add Railway horizontal scaling (2–3 replicas); set `max` pool to 5 per replica |
| 10,000+ users | Add CDN for photo proxy (Cloudflare); consider Neon read replicas for analytics queries |
| High write volume | Separate read/write DB connections using Neon's read replica endpoint |
