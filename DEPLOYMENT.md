# Antigravity / ShopGalaxy — Free Deployment Guide

**Stack:** React + Vite (frontend) · Node + Express (backend) · **MongoDB Atlas** (database)

---

## Prerequisites

1. GitHub repo with this project pushed
2. [MongoDB Atlas](https://cloud.mongodb.com) free cluster (M0)
3. [Vercel](https://vercel.com) account (frontend)
4. [Render](https://render.com) account (backend, free tier)
5. Optional: [Anthropic API key](https://console.anthropic.com) for AI SEO

---

## Step 1 — MongoDB Atlas (free)

1. Create a cluster → **M0 Free**.
2. **Database Access** → add user + password.
3. **Network Access** → allow `0.0.0.0/0` (required for Render).
4. **Connect** → Drivers → copy connection string:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/shopgalaxy?retryWrites=true&w=majority
   ```
5. If cluster is **Paused**, click **Resume** in Atlas dashboard.

Seed products (optional, local):
```bash
cd backend
npm install
# set MONGO_URI in .env
node seed.js
```

---

## Step 2 — Deploy backend on Render (free)

1. Render Dashboard → **New** → **Web Service**.
2. Connect your GitHub repo.
3. Settings:
   | Field | Value |
   |--------|--------|
   | Root Directory | `backend` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |

4. **Environment variables:**

   | Key | Value |
   |-----|--------|
   | `MONGO_URI` | Your Atlas connection string |
   | `FRONTEND_URL` | `https://YOUR-APP.vercel.app` (add after Vercel deploy) |
   | `ANTHROPIC_API_KEY` | Your Claude API key (optional) |
   | `PORT` | `5000` (Render sets this automatically; optional) |

5. Deploy → copy URL, e.g. `https://antigravity-api.onrender.com`

6. Test: open `https://YOUR-RENDER-URL/` → should return JSON `{ ok: true, ... }`

> **Note:** Free Render sleeps after ~15 min idle. First request may take 30–60 seconds.

---

## Step 3 — Deploy frontend on Vercel (free)

1. Vercel → **Add New Project** → import GitHub repo.
2. Settings:
   | Field | Value |
   |--------|--------|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

3. **Environment variable:**

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com` (no trailing slash) |

4. Deploy → copy Vercel URL, e.g. `https://antigravity.vercel.app`

5. Go back to **Render** → set `FRONTEND_URL` to your Vercel URL → **Redeploy** backend (for CORS).

---

## Step 4 — CORS

Backend allows:

- `FRONTEND_URL` from env
- `http://localhost:5173` / `5174` (local dev)
- Any `*.vercel.app` preview/production URL

---

## Local development

**Terminal 1 — backend:**
```bash
cd backend
cp .env.example .env
# edit .env with MONGO_URI
npm install
npm start
```

**Terminal 2 — frontend:**
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

Open `http://localhost:5173` — **do not use Go Live** on `index.html`; Vite is required for React.

---

## Checkout not working?

1. Backend must be running (`npm start` in `backend/`).
2. MongoDB Atlas cluster must be **Active** (not paused).
3. Frontend must use `npm run dev` or Vercel build — not Live Server alone.
4. Browser console (F12) → check for CORS or network errors on `POST /api/orders`.

---

## AI Auto SEO

- Admin → Product Manager → fill **Name** + **Description** → **Auto Generate SEO**
- Uses Claude model `claude-sonnet-4-20250514` when `ANTHROPIC_API_KEY` is set
- Without API key, smart fallback SEO is generated locally
