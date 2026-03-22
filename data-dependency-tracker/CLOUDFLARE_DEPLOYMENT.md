# Cloudflare Full Stack Deployment Guide

This guide walks you through hosting the Data Dependency Tracker on Cloudflare Pages + Workers + D1.

---

## Architecture

```
┌─────────────────────────────────────────┐
│   Cloudflare Pages (Frontend)           │
│   React + Vite                          │
│   Static site hosted globally           │
└────────────────┬────────────────────────┘
                 │
                 │ HTTPS API calls
                 ▼
┌─────────────────────────────────────────┐
│   Cloudflare Workers (Backend)          │
│   Node.js-compatible API server         │
│   D1Storage driver                      │
└────────────────┬────────────────────────┘
                 │
                 │ SQL queries
                 ▼
┌─────────────────────────────────────────┐
│   Cloudflare D1 (Database)              │
│   Serverless SQLite                     │
│   Persistent data store                 │
└─────────────────────────────────────────┘
```

---

## Prerequisites

1. Cloudflare account (free or paid)
2. Node.js 16+ installed locally
3. `wrangler` CLI installed: `npm install -g @cloudflare/wrangler`
4. GitHub or Git repository for your project (optional but recommended)

---

## Step 1: Set Up Wrangler Authentication

```bash
wrangler login
```

This opens a browser to authorize your Cloudflare account.

---

## Step 2: Create D1 Database

```bash
cd backend
wrangler d1 create ddt-database
```

Note the database ID from the output. Update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ddt-database"
database_id = "YOUR_DATABASE_ID_HERE"
```

---

## Step 3: Deploy Backend Workers

```bash
cd backend
wrangler deploy
```

This publishes your Worker. The output includes your Worker URL:
```
https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev
```

Save this URL for the frontend environment configuration.

---

## Step 4: Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with the optimized production build.

---

## Step 5: Deploy Frontend to Pages

**Option A: UI Upload**

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **Create a project** → **Direct upload**
3. Drag the `frontend/dist/` folder
4. Set build command: (leave empty)
5. Set build output: `dist`
6. Click **Deploy**

**Option B: Git Integration** (recommended for future updates)

1. Push your repo to GitHub
2. In Cloudflare Pages: **Connect to Git**
3. Select your repository
4. Set build command: `cd frontend && npm run build`
5. Set build output: `frontend/dist`
6. Click **Deploy**

---

## Step 6: Configure Frontend Environment

In the Pages project settings:

1. Go to **Settings** → **Environment variables**
2. Add variable:
   - Name: `VITE_API_URL`
   - Value: `https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev`
3. Apply to all environments (Production, Preview, Development)
4. Trigger a new deployment

---

## Step 7: Verify Deployment

Test the endpoints:

```bash
# Health check
curl https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev/api/health

# Setup demo data
curl -X POST https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev/api/setup-demo

# Get tables
curl https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev/api/tables
```

---

## Step 8: Configure Custom Domain (Optional)

1. In Pages project settings: **Custom domains**
2. Add your domain (must be managed by Cloudflare)
3. Click **Activate domain**

---

## Production Configuration

### CORS Settings

Update `backend/src/index.js` if needed:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### Rate Limiting

Add to `wrangler.toml`:

```toml
[env.production]
routes = [
  { pattern = "example.com/api/*", zone_name = "example.com" }
]
```

### Monitoring

- **Worker logs**: `wrangler tail` 
- **Pages analytics**: Cloudflare Dashboard
- **Database**: `wrangler d1 info ddt-database`

---

## Updating the Application

### Backend Update

```bash
cd backend
# Make code changes
wrangler deploy
```

### Frontend Update

**With Git:**
Push to your repo; Cloudflare automatically redeploys.

**Manual upload:**
```bash
cd frontend
npm run build
# Upload dist/ via Pages UI
```

---

## Data Persistence

All data is stored in D1 SQLite. To back up:

```bash
wrangler d1 backup-restore download ddt-database
```

To restore from backup:

```bash
wrangler d1 backup-restore restore ddt-database BACKUP_FILE.sql
```

---

## Troubleshooting

### "Database not found"

Ensure `database_id` in `wrangler.toml` matches `wrangler d1 list` output.

### CORS errors

Update `Access-Control-Allow-Origin` in `backend/src/index.js` to match your frontend domain.

### Worker timeout

D1 free tier has a 30-second timeout. Optimize queries or upgrade plan.

### Pages build fails

Check build logs in Cloudflare Dashboard. Ensure `npm install` succeeds.

---

## Cost Estimate

- **Pages**: Free (100 deploys/month, unlimited requests)
- **Workers**: Free tier: 100,000 requests/day
- **D1**: Free tier: 5GB storage, unlimited reads/writes

For production workloads, consider paid plans.

---

## Local Development

Run locally while testing Cloudflare:

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

Set `VITE_API_URL=http://localhost:5000` in frontend `.env` for local testing.

---

## Next Steps

1. ✅ Backend deployed on Workers with D1
2. ✅ Frontend deployed on Pages
3. Consider:
   - Add authentication (Cloudflare Access)
   - Enable caching with Cloudflare Cache API
   - Set up analytics
   - Configure email notifications

---

For more info: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/) | [D1 Docs](https://developers.cloudflare.com/d1/)
