import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000, // 30s to allow scraping to complete
  headers: { "Content-Type": "application/json" },
});

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const searchJobs = (title, skills) =>
  api.get("/jobs/search", { params: { title, skills: skills.join(",") } });

// ─── Tracker ──────────────────────────────────────────────────────────────────

export const getTrackedJobs = () => api.get("/tracker");

export const addTrackedJob = (data) => api.post("/tracker", data);

export const updateTrackedJob = (id, data) => api.put(`/tracker/${id}`, data);

export const deleteTrackedJob = (id) => api.delete(`/tracker/${id}`);

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = () => api.get("/notifications");

export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.put("/notifications/read-all");

export const triggerReminderCheck = () => api.post("/notifications/trigger");

export default api;
