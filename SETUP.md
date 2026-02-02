# 🚀 SETUP GUIDE - Sistem Absensi PKL

## ⚠️ LANGKAH PENTING SEBELUM MENJALANKAN

### 1️⃣ SETUP SUPABASE (WAJIB)

**a) Buat Supabase Project:**

1. Kunjungi https://supabase.com
2. Login / Sign up
3. Buat project baru
4. Tunggu hingga selesai (~ 2 menit)

**b) Dapatkan Credentials:**

1. Buka project → Settings → API
2. Copy: `Project URL` → ini adalah `SUPABASE_URL`
3. Copy: `anon public` key → ini adalah `SUPABASE_ANON_KEY`

Contoh:

```
SUPABASE_URL = https://abcd1234.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**c) Create Database Tables:**

1. Buka project → SQL Editor
2. Klik "New Query"
3. Copy-paste seluruh isi file `database.sql`
4. Click "RUN" (tombol play biru)
5. Tunggu hingga selesai

Jika success: `✓ Success. No results.` atau tables muncul di sidebar

---

### 2️⃣ SETUP BACKEND

**a) Edit file `.env` di folder `backend/`:**

```env
PORT=5000
SUPABASE_URL=https://abcd1234.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890
NODE_ENV=development
BYPASS_WIFI_CHECK=true
```

⚠️ Pastikan:

- SUPABASE_URL dan SUPABASE_ANON_KEY dari Supabase dashboard
- JWT_SECRET minimal 32 karakter (bisa copas contoh di atas)

**b) Install dependencies:**

```bash
cd backend
npm install
```

**c) Seed database (buat admin + 40 siswa):**

```bash
npm run seed
```

Jika sukses akan muncul:

```
✅ Admin user berhasil dibuat
✅ 40 student berhasil dibuat/ada
✅ Seeding selesai!
```

**d) Start backend:**

```bash
npm run dev
```

Output akan seperti:

```
🚀 Server berjalan di http://localhost:5000
📝 Health check: http://localhost:5000/health
```

---

### 3️⃣ SETUP FRONTEND

**a) Install dependencies:**

```bash
cd frontend
npm install
```

**b) Start frontend:**

```bash
npm run dev
```

Output akan seperti:

```
VITE v5.0.0  ready in 234 ms

➜  Local:   http://localhost:5173/
```

Browser akan auto-open ke http://localhost:5173

---

## 🔓 Login Credentials

Setelah seed berhasil, gunakan:

### Admin

```
Nama: admin
Password: admin123
```

### Mahasiswa/Anak SMK

Jalankan di terminal backend:

```bash
npm run list-users
```

Pilih salah satu nama, gunakan password: `12345678`

---

## ✅ Testing Checklist

- [ ] Supabase project sudah dibuat
- [ ] database.sql sudah dijalankan (tables ada)
- [ ] .env di backend sudah diisi Supabase credentials
- [ ] `npm run seed` berhasil di backend
- [ ] Backend berjalan: `npm run dev` di port 5000
- [ ] Frontend berjalan: `npm run dev` di port 5173
- [ ] Bisa login sebagai admin/admin123
- [ ] Bisa login sebagai siswa

---

## 🐛 Troubleshooting

### ❌ "SUPABASE_URL dan SUPABASE_ANON_KEY harus didefinisikan"

**Solusi**: Edit `.env` di backend folder dengan credentials dari Supabase dashboard

### ❌ "Database error" saat login/absen

**Solusi**: Pastikan database.sql sudah dijalankan di Supabase SQL Editor. Lihat tables di sidebar

### ❌ "Cannot find module" saat npm run seed

**Solusi**:

```bash
cd backend
npm install
```

### ❌ Frontend tidak bisa connect ke backend

**Solusi**:

- Pastikan backend berjalan di port 5000
- Pastikan CORS enabled di backend (sudah ada di server.js)
- Cek `.env` frontend: `VITE_API_URL=http://localhost:5000/api`

---

## 📊 API Endpoints (untuk testing)

**Health Check:**

```bash
curl http://localhost:5000/health
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"nama":"admin","password":"admin123","deviceId":"test-device"}'
```

**Get Stats (pakai token dari login):**

```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚀 Scripts yang tersedia

**Backend:**

```bash
npm run dev           # Start server (development)
npm run seed          # Seed database
npm run create-admin  # Create new admin user
npm run list-users    # List semua users
```

**Frontend:**

```bash
npm run dev      # Development server
npm run build    # Build untuk production
npm run preview  # Preview production build
```

---

**Jika masih ada masalah, pastikan:**

1. Supabase credentials sudah benar di `.env`
2. Database tables sudah dibuat
3. npm packages sudah ter-install (`npm install`)
4. Port 5000 dan 5173 tidak dipakai aplikasi lain
