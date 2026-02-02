// Middleware untuk WiFi Kampus restriction
export const wifiKampus = (req, res, next) => {
  // Development: bypass WiFi check jika BYPASS_WIFI_CHECK=true
  if (process.env.BYPASS_WIFI_CHECK === "true") {
    console.log("⚠️  WiFi check bypassed (development mode)");
    return next();
  }

  // Production: check IP range 103.209.9.*
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const ipRegex = /^103\.209\.9\.\d{1,3}$/;

  if (!ipRegex.test(clientIp)) {
    console.log(`❌ Absen attempt dari IP tidak diizinkan: ${clientIp}`);
    return res.status(403).json({
      success: false,
      message:
        "Absensi hanya dapat dilakukan dari WiFi Kampus (IP: 103.209.9.*)",
      clientIp: clientIp,
    });
  }

  console.log(`✅ WiFi Kampus verified: ${clientIp}`);
  next();
};
