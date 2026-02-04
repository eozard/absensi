// Middleware untuk WiFi Kampus restriction
export const wifiKampus = (req, res, next) => {
  // Development: bypass WiFi check jika BYPASS_WIFI_CHECK=true
  if (process.env.BYPASS_WIFI_CHECK === "true") {
    console.log("⚠️  WiFi check bypassed (development mode)");
    return next();
  }

  // Production: get real client IP (support proxy/load balancer)
  const clientIp = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() || // Railway/Nginx
    req.headers['x-real-ip'] || // Alternative header
    req.ip || 
    req.connection.remoteAddress || 
    "unknown";

  console.log(`🔍 Checking WiFi - Client IP: ${clientIp}`);
  console.log(`📋 Headers:`, {
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip'],
    'req.ip': req.ip
  });

  // Check IP range 103.209.9.* (sesuaikan dengan IP WiFi kampus kamu)
  const ipRegex = /^103\.209\.9\.\d{1,3}$/;

  if (!ipRegex.test(clientIp)) {
    console.log(`❌ Absen ditolak - IP tidak diizinkan: ${clientIp}`);
    return res.status(403).json({
      success: false,
      message: "Absensi hanya dapat dilakukan dari WiFi Kampus (IP: 103.209.9.*)",
      clientIp: clientIp,
      hint: "Pastikan Anda terhubung ke WiFi sekolah"
    });
  }

  console.log(`✅ WiFi Kampus verified: ${clientIp}`);
  next();
};
