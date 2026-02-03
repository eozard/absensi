# 🚀 Setup Fullstack Project

Project ini sudah di-reorganisasi menjadi struktur fullstack monorepo dengan backend Express dan frontend React dalam 1 repository.

## 📁 Struktur Baru

```
absensi-pkl-supabase/
├── server/          ← Backend Express API (port 5000)
├── client/          ← Frontend React Vite (port 5173)
├── package.json     ← Root scripts
└── .env             ← Shared environment variables
```

## ✅ Apa yang Sudah Dilakukan

- [x] Rename `backend/` → `server/`
- [x] Rename `frontend/` → `client/`
- [x] Update root `package.json` dengan semua dependencies
- [x] Update `server/server.js` untuk serve frontend static files
- [x] Update `client/vite.config.js` dengan API proxy
- [x] Install semua dependencies
- [x] Create `.env.example` untuk dokumentasi

## 🛠️ Setup Langkah-Langkah

### 1. Setup Environment Variables

```bash
# Copy dari example
cp .env.example .env

# Edit .env dengan credentials Supabase Anda:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-secret-key
```

### 2. Database Setup (Opsional)

```bash
# Jalankan seed untuk dummy data
npm run seed

# Atau create admin user
npm run create-admin

# List all users
npm run list-users
```

## 🚀 Menjalankan Project

### Option A: Development (Recommended)

Jalankan dalam 2 terminal terpisah untuk hot-reload:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# ✅ Server di http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# ✅ Frontend di http://localhost:5173
# API proxy otomatis ke http://localhost:5000/api
```

### Option B: Production (Single Server)

```bash
# 1. Build frontend
cd client && npm run build

# 2. Run server (akan serve frontend build + API)
cd ../server && npm run dev
# ✅ Access di http://localhost:5000
```

## 📝 Commands Tersedia

```bash
# Root level
npm run dev              # Run backend
npm run dev:frontend    # Run frontend dev
npm run build:frontend  # Build frontend
npm run preview:frontend # Preview build
npm run seed            # Seed database
npm run create-admin    # Create admin user
npm run list-users      # List all users
```

## 🔧 Konfigurasi

### API Proxy (Development)

File: `client/vite.config.js`
```javascript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
    },
  },
},
```

### API URL (Frontend)

File: `client/src/utils/axios.js`
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

### Static Files Serving

File: `server/server.js`
- Production: Serve dari `client/dist/`
- Development: Fallback ke `client/public/`

## 🚨 Troubleshooting

### Port sudah terpakai

```bash
# Kill process di port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process di port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module not found errors

```bash
# Clear node_modules dan reinstall
rm -r node_modules server/node_modules client/node_modules package-lock.json
npm install
cd server && npm install && cd ../client && npm install && cd ..
```

### .env not loaded

Pastikan file `.env` ada di root project dan berisi variabel yang tepat.

## 📊 Project Structure

```
server/
├── config/          # Konfigurasi (Supabase)
├── middleware/      # Auth, WiFi check
├── routes/          # API routes (auth, admin)
├── scripts/         # Database scripts
└── server.js        # Entry point

client/
├── src/
│   ├── components/  # React components
│   ├── pages/       # Page components
│   ├── utils/       # Helper utilities
│   └── App.jsx
├── dist/            # Build output (prod)
├── vite.config.js   # Vite config
└── tailwind.config.js
```

## ✨ Next Steps

1. **Setup Supabase**: Create account dan copy credentials ke `.env`
2. **Run Database Migration**: `npm run seed`
3. **Start Development**: Terminal 1 & 2 commands
4. **Test Login**: http://localhost:5173 (dev) atau http://localhost:5000 (prod)

---

**Catatan**: Project ini sekarang bisa di-deploy sebagai satu unit ke platform seperti Heroku, Railway, Vercel, atau server tradisional.
