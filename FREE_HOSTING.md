# 💰 Web Hosting GRATIS (100% Free)

## ✅ OPSI GRATIS YANG BISA DIPAKAI

### **1️⃣ Render.com (BEST) ⭐⭐⭐⭐⭐**

```
✅ 750 jam/bulan = 24/7 berjalan!
✅ Gratis SELAMANYA
✅ No credit card needed
✅ Good performance
✅ Auto-deploy dari GitHub

❌ Terpisah backend + frontend (2 service)
```

**Cara setup:**

**Backend (Web Service):**

```bash
1. https://render.com/auth/google (atau GitHub)
2. Dashboard → New+ → Web Service
3. Connect GitHub repo (pkl4)
4. Settings:
   - Name: absensi-backend
   - Root Directory: server
   - Environment: Node
   - Build Command: npm install
   - Start Command: node server.js
5. Environment Variables:
   - SUPABASE_URL=...
   - SUPABASE_ANON_KEY=...
   - JWT_SECRET=...
   - NODE_ENV=production
6. Create Web Service → Deploy!
7. Dapat URL: https://absensi-backend.onrender.com
```

**Frontend (Static Site):**

```bash
1. New+ → Static Site
2. Same repo (pkl4)
3. Settings:
   - Root Directory: client
   - Build Command: npm install && npm run build
   - Publish Directory: client/dist
4. Environment Variables:
   VITE_API_URL=https://absensi-backend.onrender.com/api
5. Create Static Site → Deploy!
6. Dapat URL: https://absensi-frontend.onrender.com
```

**Cost:** FREE FOREVER (750 jam/bulan)

---

### **2️⃣ Vercel (Frontend Only) ⭐⭐⭐⭐**

```
✅ Unlimited free deployments
✅ Super cepat (global CDN)
✅ No setup needed
✅ Best for React/Vite

❌ Frontend only (perlu backend di tempat lain)
```

**Setup:**

```bash
1. https://vercel.com/login (GitHub)
2. Add New Project → Import
3. Select repository: pkl4
4. Framework: Vite
5. Root Directory: client
6. Environment Variables:
   VITE_API_URL=https://your-backend.com/api
7. Deploy!
8. Dapat URL: https://pkl4-frontend.vercel.app
```

**Cost:** FREE SELAMANYA

**Pairing:** Vercel (frontend) + Render (backend) = GRATIS TOTAL!

---

### **3️⃣ Netlify (Frontend Only) ⭐⭐⭐⭐**

```
✅ Unlimited free deployments
✅ Fast CDN
✅ Easy setup
✅ No credit card needed

❌ Frontend only
```

**Setup:**

```bash
1. https://netlify.com (login GitHub)
2. New site from Git
3. Pick repository: pkl4
4. Settings:
   - Base directory: client
   - Build command: npm run build
   - Publish directory: client/dist
5. Advanced build settings:
   Environment: VITE_API_URL=https://your-backend.com/api
6. Deploy!
7. Dapat URL: https://pkl4.netlify.app
```

**Cost:** FREE SELAMANYA

---

### **4️⃣ GitHub Pages (Static Only) ⭐⭐⭐**

```
✅ 100% free
✅ Unlimited deployments
✅ No external dependencies

❌ Static sites only (React ok, backend NO)
❌ Setup lebih kompleks
```

**Untuk frontend:**

```bash
1. Add ke package.json:
   "homepage": "https://farhan55.github.io/pkl4"

2. Install gh-pages:
   npm install --save-dev gh-pages

3. Add scripts:
   "deploy": "npm run build && gh-pages -d dist"

4. npm run deploy

5. Akses: https://farhan55.github.io/pkl4
```

**Cost:** FREE SELAMANYA

---

### **5️⃣ Fly.io (Free Tier) ⭐⭐⭐**

```
✅ Free tier bagus
✅ Support fullstack
✅ Global deployment

❌ Perlu CLI setup
❌ Limited free tier (3 shared-cpu VM)
```

**Setup:**

```bash
1. https://fly.io (sign up)
2. npm install -g flyctl
3. flyctl auth login
4. flyctl launch --nodejs
5. flyctl deploy
```

**Cost:** FREE tier includes 3 shared VM

---

### **6️⃣ Railway (Free Tier Limited) ⭐⭐⭐**

```
✅ $5 credit/bulan gratis
✅ All-in-one setup

❌ Finite credit (habis = stop)
❌ Bukan truly free
```

**Cost:** $5 credit/bulan (bisa habis jika traffic tinggi)

---

### **❌ YANG TIDAK BISA (GRATIS)**

| Platform          | Alasan                               |
| ----------------- | ------------------------------------ |
| **Heroku**        | Tutup free tier (Nov 2022)           |
| **AWS Free Tier** | Limited 1 tahun, perlu credit card   |
| **Google Cloud**  | Limited free tier, perlu credit card |
| **Azure**         | Limited free tier, perlu credit card |
| **DigitalOcean**  | Minimum $5-6/bulan                   |

---

## 🎯 KOMBINASI GRATIS TERBAIK

### **OPSI A: Full Free (Render + Vercel)**

```
Backend:  Render.com   (750 jam/bulan)
Frontend: Vercel.com   (unlimited)
Bonus:    Render 750 jam = 24/7 berjalan!
Cost:     $0 SELAMANYA ✅
```

**Setup time:** ~20 menit
**Recommended:** ⭐⭐⭐⭐⭐ BEST!

---

### **OPSI B: Full Free (Render + Netlify)**

```
Backend:  Render.com   (750 jam/bulan)
Frontend: Netlify.com  (unlimited)
Cost:     $0 SELAMANYA ✅
```

**Setup time:** ~20 menit
**Recommended:** ⭐⭐⭐⭐⭐ BEST!

---

### **OPSI C: Full Free (Fly.io)**

```
Backend + Frontend: Fly.io (free tier)
Cost:     $0 SELAMANYA ✅
```

**Setup time:** ~15 menit (perlu CLI)
**Recommended:** ⭐⭐⭐⭐

---

### **OPSI D: GitHub Pages (Frontend Only)**

```
Frontend: GitHub Pages (free)
Backend:  Render.com (free)
Cost:     $0 SELAMANYA ✅
```

**Setup time:** ~30 menit
**Recommended:** ⭐⭐⭐⭐

---

## 📊 PERBANDINGAN GRATIS

| Platform         | Backend | Frontend  | Biaya | Effort | Best For           |
| ---------------- | ------- | --------- | ----- | ------ | ------------------ |
| **Render**       | ✅ 750h | ✅ 750h   | FREE  | Easy   | Backend + Frontend |
| **Vercel**       | ❌      | ✅        | FREE  | Easy   | Frontend only      |
| **Netlify**      | ❌      | ✅        | FREE  | Easy   | Frontend only      |
| **Fly.io**       | ✅      | ✅        | FREE  | Medium | Fullstack          |
| **GitHub Pages** | ❌      | ✅ Static | FREE  | Hard   | Static site        |

---

## 🚀 RECOMMENDED SETUP UNTUK KAMU

### **STEP 1: Deploy Backend ke Render**

```bash
# Terminal
1. https://render.com → New Web Service
2. Connect pkl4 repo
3. Root: server
4. Auto-deploy!
5. Get URL: https://absensi-backend.onrender.com
```

### **STEP 2: Deploy Frontend ke Vercel**

```bash
# Terminal
1. https://vercel.com → Import Project
2. Select pkl4 repo
3. Root: client
4. Set env: VITE_API_URL=https://absensi-backend.onrender.com/api
5. Auto-deploy!
6. Get URL: https://pkl4-frontend.vercel.app
```

### **SELESAI! 🎉**

**Total Cost:** $0
**Setup Time:** ~20 minutes
**Uptime:** 24/7 ✅

---

## ⚠️ LIMITASI GRATIS YANG HARUS TAHU

### **Render 750 jam/bulan**

```
= 750 / 24 = 31 hari
= UNLIMITED 24/7 berjalan

Jadi gratis SELAMANYA tanpa stop! ✅
```

### **Vercel Free Tier**

```
- Build: 100 per hari (unlimited sebenarnya)
- Deployments: Unlimited
- Bandwidth: 100 GB/bulan
- Functions: Unlimited

Untuk app kecil, tidak akan pernah hit limit ✅
```

### **Netlify Free Tier**

```
- Bandwidth: 100 GB/bulan
- Builds: 300 minutes/bulan
- Deploy: Unlimited

Cukup untuk traffic medium ✅
```

---

## 🔄 JIKA TRAFFIC MENINGKAT

Upgrade dari:

| Free → Paid                   |
| ----------------------------- |
| Render 750h → Render $7/mo    |
| Vercel free → Vercel $20/mo   |
| Netlify free → Netlify $19/mo |

Tapi mulai dengan gratis dulu! Upgrade nanti kalau perlu.

---

## ✨ KESIMPULAN

**GRATIS TERBAIK untuk Absensi PKL:**

```
Backend:  Render.com   (750 jam/bulan gratis)
Frontend: Vercel.com   (unlimited gratis)
Database: Supabase.com (gratis juga!)

Total: $0 SELAMANYA ✅
```

**Next step:** Siap deploy? 🚀
