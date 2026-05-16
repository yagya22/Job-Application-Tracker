require("dotenv").config();

const express = require("express");
const cors    = require("cors");

const jobsRoute          = require("./routes/jobs");
const trackerRoute       = require("./routes/tracker");
const notificationsRoute = require("./routes/notifications");
const reminderService    = require("./services/reminderService");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (minimal, production-safe)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/jobs",          jobsRoute);
app.use("/api/tracker",       trackerRoute);
app.use("/api/notifications", notificationsRoute);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
);

// ─── 404 & Error Handlers ────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Visa Jobs API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

// Start cron-based reminder service
reminderService.start();

module.exports = app;
