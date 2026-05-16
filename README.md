# VisaTrack — Europe & Remote Job Tracker

A full-stack web app to find and track visa-sponsored jobs in Europe and Remote.

---

## Features

- **Live job search** — aggregates listings from 7 job boards simultaneously
- **Visa sponsorship filter** — surfaces roles that offer visa support
- **Manual application tracking** — track jobs you applied to from any career site or job board
- **Application tracker** — status pipeline (Applied → Interview → Offer / Rejected), notes, applied date
- **Two views** — table view and Kanban board
- **7-day follow-up reminders** — in-app notifications + email digest for stale applications
- **In-app delete confirmation** — no browser dialogs, all interactions stay in-app
- **Dark mode** — full dark/light theme support

---

## Job Sources

| Source | Type |
|--------|------|
| Arbeitnow | Europe visa jobs API |
| Adzuna | Germany jobs aggregator |
| Jobicy | Remote jobs |
| The Muse | International roles |
| Remotive | Remote tech jobs |
| RemoteOK | Remote jobs |
| Working Nomads | Remote jobs |

---

## Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18 + Vite + Tailwind CSS |
| Backend   | Node.js + Express |
| Database  | PostgreSQL (via pg / node-postgres) |
| Scraping  | Axios |
| Email     | Nodemailer |
| Scheduler | node-cron |
| Hosting   | Render (backend + PostgreSQL + frontend) |

---

## Getting Started (Local)

### Prerequisites
- Node.js 20+
- npm
- A PostgreSQL database (local install or a free cloud instance — Render, Neon, Supabase all work)

### 1. Clone

```bash
git clone https://github.com/yagya22/Job-Application-Tracker.git
cd Job-Application-Tracker
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and optionally email credentials
npm install
npm run dev
# API running at http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/visajobs

# Email reminders (optional — Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=you@gmail.com
EMAIL_TO=you@gmail.com

# CORS
CORS_ORIGINS=http://localhost:5173

# Adzuna API (optional — free at developer.adzuna.com)
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

# Reminder schedule (default: 9am daily)
REMINDER_CRON=0 9 * * *
FOLLOW_UP_DAYS=7
```

### Frontend (`frontend/.env`)

```env
# Leave empty for local dev (proxied via Vite to /api)
# Set to your Render backend URL when deploying
VITE_API_URL=https://your-backend.onrender.com
```

---

## Deploying to Render

### Backend (Web Service)
1. Connect your GitHub repo in Render dashboard
2. Set **Root Directory** to `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `node src/index.js`
5. Add all environment variables from `backend/.env.example`
6. Set `DATABASE_URL` to the Internal Database URL from your Render PostgreSQL instance

### Database (PostgreSQL)
1. Create a new PostgreSQL instance on Render (free tier available)
2. Copy the **Internal Database URL** into your backend's `DATABASE_URL` env var
3. The schema is created automatically on first startup

### Frontend (Static Site)
1. Connect your GitHub repo in Render dashboard
2. Set **Root Directory** to `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend-url.onrender.com`

Render auto-deploys on every push to `main` — no CI/CD configuration needed.

---

## API Reference

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/search?title=&skills=` | Search visa jobs across all sources |
| GET | `/api/health` | Health check |

### Tracker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracker` | List all tracked applications |
| POST | `/api/tracker` | Add application manually |
| PUT | `/api/tracker/:id` | Update status / notes |
| DELETE | `/api/tracker/:id` | Remove application |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications (fetched on bell open) |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| POST | `/api/notifications/trigger` | Manually trigger follow-up check |

---

## Email Reminders Setup

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Create an app password (select "Mail")
4. Add the 16-character password to `EMAIL_PASS` in your `.env`

---

## Project Structure

```
visa-jobs-germany/
├── backend/
│   ├── src/
│   │   ├── db/database.js          # PostgreSQL pool + schema init
│   │   ├── routes/
│   │   │   ├── jobs.js             # /api/jobs
│   │   │   ├── tracker.js          # /api/tracker
│   │   │   └── notifications.js    # /api/notifications
│   │   ├── scrapers/
│   │   │   ├── arbeitnow.js
│   │   │   ├── adzuna.js
│   │   │   ├── jobicy.js
│   │   │   ├── themuse.js
│   │   │   ├── remotive.js
│   │   │   ├── remoteok.js
│   │   │   ├── workingnomads.js
│   │   │   └── index.js            # Orchestrator + deduplication
│   │   ├── services/
│   │   │   ├── emailService.js     # Nodemailer digest sender
│   │   │   └── reminderService.js  # Cron follow-up checker
│   │   └── index.js                # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/index.js            # Axios instance + all API calls
│   │   ├── hooks/
│   │   │   └── useNotifications.js # Fetch on mount + bell open
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Nav + notification bell
│   │   │   ├── JobCard.jsx         # Search result card
│   │   │   ├── AddJobModal.jsx     # Manual application form
│   │   │   └── EditJobModal.jsx    # Status / notes editor
│   │   ├── pages/
│   │   │   ├── Search.jsx          # Job search + manual track entry
│   │   │   └── Tracker.jsx         # Application dashboard (table + kanban)
│   │   ├── contexts/
│   │   │   └── ThemeContext.jsx    # Dark / light mode
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## Adding More Job Sources

Create `backend/src/scrapers/newsite.js` following the same pattern as the existing scrapers, then register it in `backend/src/scrapers/index.js`:

```js
const { scrapeNewSite } = require("./newsite");

// Inside scrapeAll():
const results = await Promise.allSettled([
  scrapeArbeitnow(title, skills),
  // ... existing scrapers
  scrapeNewSite(title, skills),  // ← add here
]);
```
