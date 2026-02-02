import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load .env FIRST before importing other modules
dotenv.config();

import { verifyToken, isMahasiswa, isAdmin } from "./middleware/auth.js";
// WiFi check middleware dihapus - fitur dinonaktifkan
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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Public routes
app.post("/api/login", login);

// Protected routes - Mahasiswa
app.post("/api/absen", verifyToken, isMahasiswa, absen);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route tidak ditemukan" });
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
