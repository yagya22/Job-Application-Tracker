# 🇩🇪 VisaTrack — Germany Visa Job Tracker

A full-stack web app to find and track visa-sponsored tech jobs in Germany.

---

## Features

- **Live job scraping** — pulls from Arbeitnow (API), StepStone.de, and Indeed.de
- **Visa sponsorship filter** — only surfaces roles that offer visa support
- **Application tracker** — track status (Applied → Interview → Offer / Rejected), add notes
- **7-day follow-up reminders** — in-app notifications + email digest for stale applications
- **Two views** — table view and Kanban board
- **DevOps-ready** — Dockerized, GitHub Actions CI/CD, health checks, non-root containers

---

## Tech Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS |
| Backend   | Node.js + Express           |
| Database  | SQLite (via better-sqlite3) |
| Scraping  | Axios + Cheerio             |
| Email     | Nodemailer                  |
| Scheduler | node-cron                   |
| Container | Docker + Docker Compose     |
| CI/CD     | GitHub Actions              |

---

## Getting Started (Local, no Docker)

### Prerequisites
- Node.js 20+
- npm

### 1. Clone and set up

```bash
git clone <your-repo-url>
cd visa-jobs-germany
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your email credentials if you want email reminders
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

## Getting Started (Docker Compose)

```bash
# Copy and configure env
cp backend/.env.example backend/.env
# Edit backend/.env with your email settings

# Build and start everything
docker-compose up --build

# App: http://localhost:3000
# API: http://localhost:4000
```

### Useful Docker commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a single service
docker-compose restart backend

# Stop without deleting data
docker-compose down

# Stop AND delete the SQLite volume (wipes all tracked jobs)
docker-compose down -v

# Inspect the SQLite volume path
docker volume inspect visatrack_sqlite-data
```

---

## API Reference

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/search?title=&skills=` | Search visa jobs |
| GET | `/api/health` | Health check |

### Tracker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracker` | List all tracked jobs |
| POST | `/api/tracker` | Add application |
| PUT | `/api/tracker/:id` | Update status/notes |
| DELETE | `/api/tracker/:id` | Remove application |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| POST | `/api/notifications/trigger` | Manually trigger reminder check |

---

## Email Reminders Setup

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Create an app password (select "Mail")
4. Add to `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_TO=you@gmail.com
```

---

## CI/CD Pipeline (GitHub Actions)

The pipeline at `.github/workflows/ci.yml`:

1. **On every push/PR**: lint frontend build
2. **On merge to `main`**: build Docker images + push to GitHub Container Registry (GHCR)

### Setup

1. Push this repo to GitHub
2. Go to Settings → Actions → General → set Workflow permissions to "Read and write"
3. The `GITHUB_TOKEN` secret is auto-provided — no setup needed for GHCR

Images will be pushed to:
- `ghcr.io/YOUR_USERNAME/visatrack-backend:latest`
- `ghcr.io/YOUR_USERNAME/visatrack-frontend:latest`

---

## Project Structure

```
visa-jobs-germany/
├── backend/
│   ├── src/
│   │   ├── db/database.js          # SQLite setup + schema
│   │   ├── routes/
│   │   │   ├── jobs.js             # /api/jobs
│   │   │   ├── tracker.js          # /api/tracker
│   │   │   └── notifications.js    # /api/notifications
│   │   ├── scrapers/
│   │   │   ├── arbeitnow.js        # Primary: free Germany visa API
│   │   │   ├── stepstone.js        # StepStone.de scraper
│   │   │   ├── indeed.js           # Indeed.de scraper
│   │   │   └── index.js            # Orchestrator + deduplication
│   │   ├── services/
│   │   │   ├── emailService.js     # Nodemailer email sender
│   │   │   └── reminderService.js  # Cron-based follow-up checker
│   │   └── index.js                # Express app + server
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/index.js            # All API calls
│   │   ├── hooks/useNotifications  # Notification polling hook
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Nav + notification bell
│   │   │   ├── JobCard.jsx         # Search result card
│   │   │   ├── AddJobModal.jsx     # Manual job add form
│   │   │   └── EditJobModal.jsx    # Status/notes editor
│   │   ├── pages/
│   │   │   ├── Search.jsx          # Job search page
│   │   │   └── Tracker.jsx         # Application tracker dashboard
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .github/workflows/ci.yml        # GitHub Actions CI/CD
├── docker-compose.yml
└── README.md
```

---

## Adding More Job Sources

To add a new scraper, create `backend/src/scrapers/newsite.js` following the same pattern as `arbeitnow.js`, then import and add it to `backend/src/scrapers/index.js`:

```js
const { scrapeNewSite } = require("./newsite");

// In scrapeAll():
const [arbeitnowJobs, stepstoneJobs, indeedJobs, newSiteJobs] = await Promise.allSettled([
  scrapeArbeitnow(title, skills),
  scrapeStepstone(title, skills),
  scrapeIndeed(title, skills),
  scrapeNewSite(title, skills),   // ← add here
]);
```

---

## Future Improvements

- [ ] Add PostgreSQL for production (replace SQLite)
- [ ] Add authentication (Supabase or Passport.js)
- [ ] Puppeteer/Playwright scraper for JS-heavy sites
- [ ] LinkedIn Jobs integration (requires OAuth)
- [ ] Prometheus metrics endpoint for SRE monitoring
- [ ] Kubernetes manifests (Helm chart)
- [ ] Deployment to Hetzner Cloud / DigitalOcean
