// Middleware untuk WiFi Kampus restriction
export const wifiKampus = (req, res, next) => {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 WIFI_KAMPUS MIDDLEWARE TRIGGERED");
  console.log("=".repeat(60));
  
  // Development: bypass WiFi check jika BYPASS_WIFI_CHECK=true
  if (process.env.BYPASS_WIFI_CHECK === "true") {
    console.log("⚠️  WiFi check bypassed (development mode)");
    console.log("=".repeat(60) + "\n");
    return next();
  }

  // Production: get real client IP (support proxy/load balancer)
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() || // Railway/Nginx
    req.headers["x-real-ip"] || // Alternative header
    req.ip ||
    req.connection.remoteAddress ||
    "unknown";

  console.log(`📍 Client IP: ${clientIp}`);
  console.log(`📋 Headers:`, {
    "x-forwarded-for": req.headers["x-forwarded-for"],
    "x-real-ip": req.headers["x-real-ip"],
    "req.ip": req.ip,
  });

  // Check IP range 112.215.235.* (WiFi Kampus - sesuaikan dengan IP kamu)
  const ipRegex = /^112\.215\.235\.\d{1,3}$/;

  console.log(`🔐 Checking regex: ${ipRegex}`);
  console.log(`✔️  Match result: ${ipRegex.test(clientIp)}`);

  if (!ipRegex.test(clientIp)) {
    console.log(`❌ Absen ditolak - IP tidak diizinkan: ${clientIp}`);
    console.log("=".repeat(60) + "\n");
    return res.status(403).json({
      success: false,
      message:
        "Absensi hanya dapat dilakukan dari WiFi Kampus (IP: 112.215.235.*)",
      clientIp: clientIp,
      hint: "Pastikan Anda terhubung ke WiFi sekolah",
    });
  }

  console.log(`✅ WiFi Kampus verified: ${clientIp}`);
  console.log("=".repeat(60) + "\n");
  next();
};
