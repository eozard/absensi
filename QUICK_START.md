# ⚡ Quick Start - Fullstack Absensi PKL

Project sudah digabung! Backend + Frontend dalam 1 repository.

## 📦 Struktur Baru

```
absensi-pkl-supabase/
├── server/          (Backend - Express.js)
├── client/          (Frontend - React Vite)
├── package.json     (Root scripts)
└── .env             (Environment variables)
```

## 🚀 Jalan Cepat (3 Langkah)

### 1️⃣ Setup Environment

```bash
cp .env.example .env
# Edit .env dengan Supabase credentials Anda
```

### 2️⃣ Dependencies Sudah Install ✅

```bash
# Semuanya sudah siap! Jika belum:
npm install
cd server && npm install && cd ../client && npm install && cd ..
```

### 3️⃣ Jalankan

**Dev Mode (dengan hot-reload):**

```bash
# Terminal 1
cd server && npm run dev      # Backend: http://localhost:5000

# Terminal 2 (buka tab baru)
cd client && npm run dev      # Frontend: http://localhost:5173
```

**Production Mode (single server):**

```bash
cd client && npm run build    # Build frontend
cd ../server && npm run dev   # Serve everything on http://localhost:5000
```

## 📋 Commands

| Command                  | Keterangan                      |
| ------------------------ | ------------------------------- |
| `npm run dev`            | Run backend server              |
| `npm run dev:frontend`   | Run frontend dev server         |
| `npm run build:frontend` | Build frontend untuk production |
| `npm run seed`           | Seed dummy data ke database     |
| `npm run create-admin`   | Create admin user               |
| `npm run list-users`     | List semua users                |

## ✅ Checklist

- [x] Backend & Frontend digabung dalam 1 repo
- [x] Root package.json dengan semua scripts
- [x] Server bisa serve static files (production)
- [x] Vite proxy untuk dev mode
- [x] Semua dependencies terinstall
- [x] `.env.example` tersedia

## 🔗 Links

- **Frontend**: http://localhost:5173 (dev) atau http://localhost:5000 (prod)
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 📚 Dokumentasi Lengkap

Baca `SETUP_FULLSTACK.md` untuk setup detail dan troubleshooting.

---

**Next Step**: Setup Supabase di `.env` dan jalankan `npm run dev` + `npm run dev:frontend` 🚀
