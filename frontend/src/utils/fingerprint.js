// Device ID generator - generate dan simpan persistent device ID
export const initFingerprint = async () => {
  return Promise.resolve();
};

export const getDeviceId = async () => {
  // Check if device ID already exists in localStorage
  let stored = localStorage.getItem("deviceId");
  if (stored) {
    return stored;
  }

  // Generate deterministic device ID (stable across sessions)
  // Format: device_[fingerprint]
  const fingerprint = generateDeviceFingerprint();
  const deviceId = `device_${fingerprint}`;
  localStorage.setItem("deviceId", deviceId);
  return deviceId;
};

export const getDeviceIdSync = () => {
  // Get existing or generate new
  let stored = localStorage.getItem("deviceId");
  if (!stored) {
    const fingerprint = generateDeviceFingerprint();
    stored = `device_${fingerprint}`;
    localStorage.setItem("deviceId", stored);
    console.log("📱 New device ID generated:", stored);
    console.log("💡 Device ini akan terikat permanen ke akun yang login");
  } else {
    console.log("📱 Existing device ID loaded:", stored);
    console.log(
      "⚠️  Device sudah tersimpan - jika terikat ke user lain, login akan ditolak",
    );
  }
  return stored;
};

// Generate deterministic device fingerprint (lebih kuat dari UA saja)
const generateDeviceFingerprint = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const screenRes = `${screen.width}x${screen.height}`;
  const colorDepth = screen.colorDepth;
  const deviceMemory = navigator.deviceMemory || "";
  const hardwareConcurrency = navigator.hardwareConcurrency || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  const combined = [
    userAgent,
    platform,
    language,
    timezone,
    screenRes,
    colorDepth,
    deviceMemory,
    hardwareConcurrency,
    maxTouchPoints,
  ].join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 16);
};
