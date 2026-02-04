# WiFi Kampus Check - Setup Guide

## 🎯 Fitur Ini Untuk Apa?

**Restrict absensi HANYA bisa dilakukan dari WiFi kampus!**

Mahasiswa:

- ✅ Login bisa dari mana saja (rumah, warnet, dll)
- ❌ Absensi HANYA dari WiFi kampus (IP: 103.209.9.\*)

---

## 🔧 Setup di Railway

### **Step 1: Update Environment Variable**

Railway Dashboard → Variables → Edit `BYPASS_WIFI_CHECK`:

```env
BYPASS_WIFI_CHECK=false
```

⚠️ **PENTING:**

- `true` = WiFi check OFF (development/testing)
- `false` = WiFi check ON (production)

### **Step 2: Sesuaikan IP Range**

Edit file `server/middleware/wifiKampus.js`:

```javascript
// Ganti IP range sesuai WiFi kampus kamu
const ipRegex = /^103\.209\.9\.\d{1,3}$/;
```

**Contoh IP range lain:**

```javascript
// Single IP
const ipRegex = /^192\.168\.1\.100$/;

// Range 192.168.1.1 - 192.168.1.255
const ipRegex = /^192\.168\.1\.\d{1,3}$/;

// Range 10.0.0.1 - 10.0.255.255
const ipRegex = /^10\.0\.\d{1,3}\.\d{1,3}$/;

// Multiple ranges (OR logic)
const allowedRanges = [
  /^103\.209\.9\.\d{1,3}$/,
  /^192\.168\.1\.\d{1,3}$/
];
const isAllowed = allowedRanges.some(regex => regex.test(clientIp));
```

### **Step 3: Redeploy**

```bash
git push origin main
```

Railway auto-redeploy ✅

---

## 🧪 Testing WiFi Restriction

### **Test 1: Cek IP Address Kamu**

**Di browser, akses:**

```
https://your-railway-url.up.railway.app/api/check-ip
```

**Response:**

```json
{
  "success": true,
  "detectedIP": "103.209.9.45",
  "isWiFiKampus": true,
  "message": "✅ Anda terhubung ke WiFi Kampus"
}
```

**Jika TIDAK di WiFi kampus:**

```json
{
  "success": true,
  "detectedIP": "180.243.100.25",
  "isWiFiKampus": false,
  "message": "❌ Anda TIDAK terhubung ke WiFi Kampus"
}
```

---

### **Test 2: Login & Absensi**

#### **A. Login (bisa dari mana saja):**

```bash
POST /api/login
{
  "nama": "John Doe",
  "password": "password123",
  "deviceId": "fingerprint123"
}
```

**Expected:** ✅ Login sukses, dapat token

---

#### **B. Absensi dari WiFi Kampus:**

```bash
POST /api/absen
Headers: { Authorization: "Bearer <token>" }
{
  "type": "masuk"
}
```

**Expected:** ✅ Absensi berhasil

---

#### **C. Absensi BUKAN dari WiFi Kampus:**

```bash
POST /api/absen
Headers: { Authorization: "Bearer <token>" }
{
  "type": "masuk"
}
```

**Expected:** ❌ Error 403

```json
{
  "success": false,
  "message": "Absensi hanya dapat dilakukan dari WiFi Kampus (IP: 103.209.9.*)",
  "clientIp": "180.243.100.25",
  "hint": "Pastikan Anda terhubung ke WiFi sekolah"
}
```

---

## 🔍 Cara Cari IP WiFi Kampus

### **Option 1: Cek di Komputer Kampus**

**Windows:**

```bash
ipconfig
```

Cari:

```
IPv4 Address . . . . . . . . . . . : 103.209.9.45
```

**Linux/Mac:**

```bash
ifconfig
# atau
ip addr show
```

---

### **Option 2: Cek di Website**

1. Connect ke WiFi kampus
2. Buka: https://whatismyipaddress.com
3. Copy IP address yang terdeteksi

---

### **Option 3: Pakai Endpoint /api/check-ip**

1. Connect ke WiFi kampus
2. Deploy app ke Railway
3. Akses: `https://your-app.railway.app/api/check-ip`
4. Copy `detectedIP`

---

## 📊 How It Works

### **Flow Diagram:**

```
Mahasiswa mencoba absen
    ↓
1. Check JWT token valid?
   ❌ → Return 401 Unauthorized
   ✅ → Lanjut
    ↓
2. Check role = mahasiswa?
   ❌ → Return 403 Forbidden
   ✅ → Lanjut
    ↓
3. Check BYPASS_WIFI_CHECK=true?
   ✅ → Skip WiFi check (dev mode)
   ❌ → Lanjut
    ↓
4. Get client IP dari:
   - x-forwarded-for header (Railway/proxy)
   - x-real-ip header
   - req.ip
    ↓
5. Check IP match 103.209.9.*?
   ❌ → Return 403 "Harus WiFi kampus"
   ✅ → Lanjut
    ↓
6. Save absensi ke database ✅
```

---

## 🛠️ Troubleshooting

### **Issue 1: IP selalu "unknown" atau "::1"**

**Problem:** Railway tidak forward real IP

**Fix:** Pastikan `app.set('trust proxy', true)` di `server.js`

```javascript
// server/server.js
app.set('trust proxy', true); // ✅ Added
```

---

### **Issue 2: WiFi check tidak aktif**

**Check:**

1. Railway Variables:

   ```env
   BYPASS_WIFI_CHECK=false  # ✅ Harus false
   ```

2. Logs di Railway:
   ```
   ⚠️ WiFi check bypassed (development mode)  # ❌ Bad
   🔍 Checking WiFi - Client IP: 103.209.9.45  # ✅ Good
   ```

---

### **Issue 3: IP tidak match padahal di WiFi kampus**

**Debug steps:**

1. **Cek IP detection:**

   ```
   https://your-app.railway.app/api/check-ip
   ```

2. **Lihat logs:**
   Railway → Logs → Cari:

   ```
   🔍 Checking WiFi - Client IP: XXX.XXX.XXX.XXX
   ```

3. **Update regex di wifiKampus.js:**
   ```javascript
   // Jika IP = 192.168.1.100
   const ipRegex = /^192\.168\.1\.100$/;
   ```

---

### **Issue 4: Mobile app berbeda IP dari browser**

**Cause:** Mobile network vs WiFi

**Solution:**

```javascript
// Allow multiple IP ranges
const allowedIPs = [
  /^103\.209\.9\.\d{1,3}$/,    // WiFi kampus
  /^192\.168\.1\.\d{1,3}$/,    // Lab komputer
];

const isAllowed = allowedIPs.some(regex => regex.test(clientIp));
if (!isAllowed) {
  return res.status(403).json({...});
}
```

---

## 🎛️ Development vs Production

### **Development (.env lokal):**

```env
BYPASS_WIFI_CHECK=true
NODE_ENV=development
```

**Result:** WiFi check OFF, bisa absen dari mana saja ✅

---

### **Production (Railway Variables):**

```env
BYPASS_WIFI_CHECK=false
NODE_ENV=production
```

**Result:** WiFi check ON, hanya WiFi kampus ✅

---

## 📝 Logs untuk Debugging

**Success (WiFi kampus):**

```
🔍 Checking WiFi - Client IP: 103.209.9.45
📋 Headers: { x-forwarded-for: '103.209.9.45', ... }
✅ WiFi Kampus verified: 103.209.9.45
```

**Failed (bukan WiFi kampus):**

```
🔍 Checking WiFi - Client IP: 180.243.100.25
📋 Headers: { x-forwarded-for: '180.243.100.25', ... }
❌ Absen ditolak - IP tidak diizinkan: 180.243.100.25
```

---

## 🔐 Security Notes

1. **IP Spoofing:**
   - Railway validates `x-forwarded-for`
   - Client tidak bisa fake IP ✅

2. **VPN Detection:**
   - Jika mahasiswa pakai VPN, IP akan berubah
   - Solusi: Whitelist VPN IP juga (tidak recommended)

3. **Multiple Locations:**
   - Bisa allow multiple IP ranges
   - Contoh: Kampus A, Kampus B, Lab 1, Lab 2

---

## ✅ Checklist Deployment

- [ ] IP WiFi kampus sudah dicatat
- [ ] Regex di `wifiKampus.js` sudah diupdate
- [ ] Railway variable `BYPASS_WIFI_CHECK=false`
- [ ] Code sudah di-push ke GitHub
- [ ] Railway auto-redeploy selesai
- [ ] Test `/api/check-ip` dari WiFi kampus
- [ ] Test login (harus sukses)
- [ ] Test absen dari WiFi kampus (harus sukses)
- [ ] Test absen BUKAN dari WiFi kampus (harus ditolak)

---

**Need help?** Check Railway logs dan share screenshot error! 🔧
