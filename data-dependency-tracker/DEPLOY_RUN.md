# 🚀 Quick Deployment & Run Guide

## Option 1: Run Locally (for testing)

### Backend (Express + In-Memory Storage)
```bash
cd backend
npm install
npm start
```
Server runs at: `http://localhost:5000`

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
App runs at: `http://localhost:5173`

**Note**: Local backend uses in-memory storage (data clears on restart).

---

## Option 2: Deploy to Cloudflare (Production)

### Prerequisites
```bash
npm install -g @cloudflare/wrangler
wrangler login
```

### Step 1: Create D1 Database
```bash
cd backend
wrangler d1 create ddt-database
```
Copy the `database_id` from output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "ddt-database"
database_id = "YOUR_ID_HERE"
```

### Step 2: Deploy Backend Worker
```bash
cd backend
wrangler deploy
```
Output will show your Worker URL:
```
https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev
```

### Step 3: Build Frontend
```bash
cd frontend
npm install
npm run build
```

### Step 4: Deploy Frontend to Pages
**Option A (UI):**
1. Go to https://dash.cloudflare.com/?to=/:account/pages
2. Click "Create a project" → "Direct upload"
3. Upload the `frontend/dist/` folder
4. Click Deploy

**Option B (Git):**
1. Push code to GitHub
2. In Pages: "Connect to Git"
3. Build command: `cd frontend && npm install && npm run build`
4. Build output: `frontend/dist`
5. Click Deploy

### Step 5: Configure Frontend Environment
In Pages project settings → Environment variables:
- Key: `VITE_API_URL`
- Value: `https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev`

Hit "Deploy" to apply changes.

### Step 6: Verify Deployment
```bash
# Test backend
curl https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev/api/health

# Load demo data
curl -X POST https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev/api/setup-demo

# Get tables
curl https://ddt-backend-worker.YOUR_SUBDOMAIN.workers.dev/api/tables
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm: command not found` | Install Node.js from nodejs.org |
| `wrangler: not found` | Run `npm install -g @cloudflare/wrangler` |
| Backend won't start | Check port 5000 isn't in use: `netstat -ano \| findstr :5000` |
| Frontend build fails | Run `npm install` in frontend folder |
| CORS errors | Ensure `VITE_API_URL` matches Worker URL (no trailing slash) |
| D1 not found | Re-run `wrangler d1 create` and copy ID to `wrangler.toml` |

---

## File Structure

```
data-dependency-tracker/
├── backend/
│   ├── index.js                 (Express server - LOCAL)
│   ├── src/
│   │   ├── index.js             (Worker - CLOUDFLARE)
│   │   └── d1Storage.js         (D1 persistent storage)
│   ├── dependencyEngine.js
│   ├── storage.js
│   ├── package.json
│   └── wrangler.toml            (Cloudflare config)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── api.js
│   │   └── styles/
│   ├── dist/                    (Built files for deployment)
│   ├── package.json
│   └── vite.config.js
├── CLOUDFLARE_DEPLOYMENT.md     (Full guide)
└── README.md
```

---

## Key URLs After Deployment

| Component | URL |
|-----------|-----|
| Frontend | `https://your-domain.pages.dev` |
| Backend API | `https://ddt-backend-worker.your-subdomain.workers.dev` |
| Health Check | `/api/health` |
| Demo Data | `POST /api/setup-demo` |

---

## What's Ready to Deploy

✅ Backend Express server (local testing)
✅ Backend Cloudflare Worker (production)
✅ D1 Storage engine (persistent)
✅ Frontend React app with Query Builder
✅ All join & complex query endpoints
✅ wrangler.toml configured
✅ CLOUDFLARE_DEPLOYMENT.md guide

**Next step**: Choose Option 1 (local test) or Option 2 (production deploy) and run the commands above!
