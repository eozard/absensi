# 🔍 IP WiFi Check - Arsitektur & Solusi

## ❌ Kenapa Tidak Bisa Cuma Supabase?

Supabase adalah **database** saja, bukan server yang bisa:

- ❌ Menjalankan custom logic
- ❌ Check IP client
- ❌ Validate request dari server side

**IP Check harus di backend** karena:

```
Frontend (Browser)
├─ Bisa tahu IP local saja (private IP)
├─ Tidak bisa tahu IP publik sendiri
├─ Tidak bisa dipercaya (bisa di-fake)
└─ ❌ Tidak aman untuk validasi

Backend (Server)
├─ Tahu IP client sebenarnya (dari request header)
├─ Bisa validate IP range
├─ Terpercaya (server-side validation)
└─ ✅ AMAN!
```

---

## ✅ SOLUSI: Ada 2 Pilihan

### **OPSI 1: Backend Tradisional (Sudah Punya!)**

```javascript
// server/server.js
app.post("/api/login", (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Check IP range 103.209.9.*
  if (!clientIP.startsWith('103.209.9')) {
    return res.status(403).json({
      error: "Hanya bisa absen dari WiFi Kampus"
    });
  }

  // Login berhasil
  res.json({ token: "..." });
});
```

**Biaya:** Hosting backend diperlukan

- ✅ Railway: $5/bulan
- ✅ Render: GRATIS (750 jam/bulan)
- ✅ Fly.io: GRATIS (limited)

---

### **OPSI 2: Supabase Functions (Serverless Backend)**

Supabase punya **Edge Functions** - ini adalah serverless backend!

```javascript
// supabase/functions/check-ip/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const clientIP = req.headers.get('cf-connecting-ip') ||
                   req.headers.get('x-forwarded-for');

  // Check WiFi campus
  if (!clientIP.startsWith('103.209.9')) {
    return new Response(
      JSON.stringify({ error: 'Only campus WiFi allowed' }),
      { status: 403 }
    );
  }

  return new Response(
    JSON.stringify({ success: true, ip: clientIP }),
    { status: 200 }
  );
})
```

**Biaya:** GRATIS! (Supabase Edge Functions free tier)

---

## 🎯 PERBANDINGAN

| Aspek           | Backend Tradisional    | Supabase Functions          |
| --------------- | ---------------------- | --------------------------- |
| **Setup**       | Medium (butuh hosting) | Easy (langsung di Supabase) |
| **Cost**        | $0-5/bulan             | FREE ✅                     |
| **Performance** | Good                   | Excellent (global CDN)      |
| **Maintenance** | Medium                 | Low                         |
| **IP Checking** | ✅ Bisa                | ✅ Bisa                     |
| **Scalability** | Limited                | Auto-scale                  |

---

## 💡 REKOMENDASI

### **Jika sudah punya backend (current):**

```
Pakai backend yang sudah ada
- Render gratis 750 jam/bulan
- IP check di: server/server.js
- Sudah jalan di http://localhost:5000 ✅
```

### **Jika mau pure Supabase (tanpa backend terpisah):**

```
Gunakan Supabase Edge Functions
- IP check di: supabase/functions/check-ip
- Deploy otomatis
- Gratis selamanya ✅
```

---

## 🔧 SOLUSI SEKARANG (QUICKEST)

**Gunakan backend yang sudah ada:**

Backend Express.js Anda (server/server.js) sudah implement IP check:

```javascript
// File: server/routes/auth.js (line ~100)

const clientIP = req.headers['x-forwarded-for'] ||
                 req.connection.remoteAddress;

// Cek WiFi campus
if (process.env.BYPASS_WIFI_CHECK !== 'true') {
  if (!isValidCampusIP(clientIP)) {
    return res.status(403).json({
      error: "Hanya bisa absen dari WiFi Kampus"
    });
  }
}
```

**Status:** ✅ Sudah jalan!

---

## 📝 JIKA INGIN PINDAH KE SUPABASE FUNCTIONS

### **Langkah 1: Create Function**

```bash
cd supabase
supabase functions new check-ip
```

### **Langkah 2: Code Function**

```typescript
// supabase/functions/check-ip/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const clientIP = req.headers.get('cf-connecting-ip');

  // Validasi IP
  const ipRange = '103.209.9'; // Campus WiFi
  if (!clientIP.startsWith(ipRange)) {
    return new Response(
      JSON.stringify({ error: 'Only campus WiFi allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Jika IP valid, create token
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  // Generate JWT atau lakukan login logic
  return new Response(
    JSON.stringify({ success: true, ip: clientIP }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
})
```

### **Langkah 3: Deploy**

```bash
supabase functions deploy check-ip
```

### **Langkah 4: Call dari Frontend**

```javascript
// frontend/src/pages/LoginPage.jsx
const response = await fetch(
  `https://your-project.supabase.co/functions/v1/check-ip`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }
);
```

---

## ⚡ KESIMPULAN

| Situasi                      | Rekomendasi                      | Biaya   |
| ---------------------------- | -------------------------------- | ------- |
| **Sekarang (exist backend)** | Keep Express.js server           | $0-5/mo |
| **Mau pure Supabase**        | Supabase Functions               | FREE ✅ |
| **Mau yang termudah**        | Render backend + Vercel frontend | FREE ✅ |

---

## 🎓 CATATAN PENTING

**IP Check HARUS di server**, tidak bisa di:

- ❌ Frontend (bisa di-fake)
- ❌ Supabase database saja
- ✅ Backend (Express, Supabase Functions, etc)

---

**TL;DR:**

- **Current setup:** Backend Express.js Anda sudah OK!
- **Hosting backend:** Render gratis, atau Railway $5/bulan
- **Alternatif:** Supabase Functions (gratis, serverless)
- **Biaya total:** $0 (jika pakai Render free tier) ✅
