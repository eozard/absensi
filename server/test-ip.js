import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Trust proxy untuk Railway
app.set("trust proxy", true);

// Test endpoint untuk cek IP
app.get("/check-ip", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.connection.remoteAddress;

  res.json({
    detectedIP: ip,
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      "user-agent": req.headers["user-agent"],
    },
    reqIP: req.ip,
    connectionRemoteAddress: req.connection.remoteAddress,
    isWiFiKampus: /^103\.209\.9\.\d{1,3}$/.test(ip),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`IP Check server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}/check-ip`);
});
