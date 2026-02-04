import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load .env FIRST before importing other modules
dotenv.config();

import { verifyToken, isMahasiswa, isAdmin } from "./middleware/auth.js";
import { wifiKampus } from "./middleware/wifiKampus.js";
import {
  login,
  absen,
  getRiwayat,
  submitIzin,
  getIzin,
  cancelIzin,
} from "./routes/auth.js";
import {
  getStats,
  getAttendanceToday,
  getStudents,
  getStudentAttendance,
  getDevices,
  deleteDevice,
  getUsers,
  createUser,
  getAttendanceReport,
  getAllIzin,
  updateIzinStatus,
} from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Trust proxy untuk mendapatkan real IP dari Railway/Nginx/Load Balancer
app.set("trust proxy", true);

// Serve static files from frontend build (production) or public folder
const clientPath = path.join(__dirname, "..", "client");
const publicPath = path.join(clientPath, "dist");
const indexPath = path.join(publicPath, "index.html");

// Serve static files
app.use(express.static(publicPath));

// For development, also serve from public folder if dist doesn't exist
if (!fs.existsSync(publicPath)) {
  app.use(express.static(path.join(clientPath, "public")));
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// IP Check endpoint (for testing WiFi restriction)
app.get("/api/check-ip", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.connection.remoteAddress;

  const isWiFiKampus = /^112\.215\.171\.\d{1,3}$/.test(ip);

  res.json({
    success: true,
    detectedIP: ip,
    isWiFiKampus: isWiFiKampus,
    message: isWiFiKampus
      ? "✅ Anda terhubung ke WiFi Kampus"
      : "❌ Anda TIDAK terhubung ke WiFi Kampus",
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
    },
  });
});

// Public routes
app.post("/api/login", login);

// Protected routes - Mahasiswa
app.post("/api/absen", verifyToken, isMahasiswa, wifiKampus, absen);
app.get("/api/riwayat", verifyToken, isMahasiswa, getRiwayat);
app.post("/api/izin", verifyToken, isMahasiswa, submitIzin);
app.get("/api/izin", verifyToken, isMahasiswa, getIzin);
app.delete("/api/izin/:id", verifyToken, isMahasiswa, cancelIzin);

// Protected routes - Admin
app.get("/api/admin/stats", verifyToken, isAdmin, getStats);
app.get(
  "/api/admin/attendance-today",
  verifyToken,
  isAdmin,
  getAttendanceToday,
);
app.get("/api/admin/students", verifyToken, isAdmin, getStudents);
app.get(
  "/api/admin/attendance/:nama",
  verifyToken,
  isAdmin,
  getStudentAttendance,
);
app.get("/api/admin/devices", verifyToken, isAdmin, getDevices);
app.delete("/api/admin/devices/:deviceId", verifyToken, isAdmin, deleteDevice);
app.get("/api/admin/users", verifyToken, isAdmin, getUsers);
app.post("/api/admin/users", verifyToken, isAdmin, createUser);
app.get("/api/admin/report", verifyToken, isAdmin, getAttendanceReport);
app.get("/api/admin/izin", verifyToken, isAdmin, getAllIzin);
app.put("/api/admin/izin/:id", verifyToken, isAdmin, updateIzinStatus);

// SPA fallback - serve index.html untuk semua request yang bukan API
app.get("*", (req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      res
        .status(404)
        .json({ success: false, message: "Route tidak ditemukan" });
    }
  });
});

// 404 handler (untuk API routes yang tidak cocok)
app.use("/api/*", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: "API route tidak ditemukan" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Supabase connected: ${process.env.SUPABASE_URL}`);
  console.log(
    `⚙️  WiFi check: ${process.env.BYPASS_WIFI_CHECK === "true" ? "BYPASSED (dev)" : "ENABLED (prod)"}`,
  );
});
