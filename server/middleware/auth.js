import jwt from "jsonwebtoken";

// Lazy load JWT_SECRET to ensure dotenv is loaded first
const getJWTSecret = () => {
  const secret =
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-min-32-characters-long-here";
  return secret;
};

export const verifyToken = (req, res, next) => {
  console.log("\n🔐 VERIFY_TOKEN MIDDLEWARE");
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak ditemukan" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJWTSecret());
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Token tidak valid" });
  }
};

export const isMahasiswa = (req, res, next) => {
  console.log("📚 IS_MAHASISWA MIDDLEWARE - User role:", req.user.role);
  if (req.user.role !== "mahasiswa" && req.user.role !== "anak_smk") {
    return res.status(403).json({
      success: false,
      message: "Akses hanya untuk mahasiswa/anak SMK",
    });
  }
  console.log("✅ IS_MAHASISWA: Passed");
  next();
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Akses hanya untuk admin" });
  }
  next();
};
