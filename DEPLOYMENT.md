# 🚀 Deployment Guide - Absensi PKL

## 📋 Pilihan Hosting

### **OPSI 1: Railway.app (All-in-One) - RECOMMENDED ⭐**

Railway gratis untuk start, sangat mudah untuk fullstack app.

#### Setup:

1. **Push ke GitHub:**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy ke Railway:**
   - Buka https://railway.app
   - Login dengan GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Pilih repository ini
   - Railway auto-detect Node.js

3. **Set Environment Variables:**

   Di Railway dashboard → Variables tab, tambahkan:

   ```
   SUPABASE_URL=https://pxrqmqelmpnnxgnofhwp.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_xT7r8Eb_gPX7KnmoLndQCg_r-wYbZrr
   JWT_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwxyz
   NODE_ENV=production
   BYPASS_WIFI_CHECK=false
   PORT=5000
   ```

4. **Configure Build:**

   Railway akan otomatis jalankan:
   - `npm install` (root)
   - `npm run build:frontend` (build React)
   - `npm start` (start server)

5. **Custom Start Script:**

   Tambahkan di root `package.json`:

   ```json
   "scripts": {
     "start": "node server/server.js",
     "build": "cd client && npm install && npm run build"
   }
   ```

6. **Deploy!**
   - Railway auto-deploy setiap push ke GitHub
   - Akses via URL: `https://your-app.up.railway.app`

---

### **OPSI 2: Render.com (Gratis tier lebih generous)**

#### Backend (Web Service):

1. Buka https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:

   ```
   Name: absensi-pkl-backend
   Root Directory: server
   Build Command: npm install
   Start Command: node server.js
   ```

5. Environment Variables:

   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   JWT_SECRET=...
   NODE_ENV=production
   BYPASS_WIFI_CHECK=false
   ```

6. Deploy → dapat URL backend: `https://absensi-pkl-backend.onrender.com`

#### Frontend (Static Site):

1. New → Static Site
2. Connect same repo
3. Settings:

   ```
   Name: absensi-pkl-frontend
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: client/dist
   ```

4. Environment Variables:

   ```
   VITE_API_URL=https://absensi-pkl-backend.onrender.com/api
   ```

5. Deploy → dapat URL frontend: `https://absensi-pkl-frontend.onrender.com`

---

### **OPSI 3: Vercel (Frontend) + Railway (Backend)**

#### Backend di Railway:

- Follow OPSI 1 (Railway steps)
- Dapat URL: `https://absensi-pkl.up.railway.app`

#### Frontend di Vercel:

1. Buka https://vercel.com
2. Import GitHub repository
3. Configure:

   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```

4. Environment Variables:

   ```
   VITE_API_URL=https://absensi-pkl.up.railway.app/api
   ```

5. Deploy!

---

### **OPSI 4: VPS Tradisional (DigitalOcean, AWS, etc)**

#### Setup Ubuntu Server:

```bash
# 1. Install Node.js & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (process manager)
sudo npm install -g pm2

# 3. Clone repository
git clone https://github.com/your-username/absensi-pkl.git
cd absensi-pkl

# 4. Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && npm run build && cd ..

# 5. Setup environment
cp .env.example .env
nano .env  # Edit dengan production credentials

# 6. Start dengan PM2
pm2 start server/server.js --name absensi-backend
pm2 save
pm2 startup  # Auto-start on reboot

# 7. Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/absensi
```

**Nginx Config:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React build)
    location / {
        root /path/to/absensi-pkl/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/absensi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL (optional, recommended)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Production Checklist

Sebelum deploy, pastikan:

- [ ] `.env` sudah diupdate dengan production values
- [ ] `NODE_ENV=production`
- [ ] `BYPASS_WIFI_CHECK=false` (enable WiFi check)
- [ ] JWT_SECRET minimal 32 karakter random
- [ ] Supabase RLS policies sudah benar
- [ ] Frontend build berhasil: `npm run build:frontend`
- [ ] Test local production build
- [ ] CORS configured untuk domain production

---

## 📝 Update Root package.json untuk Deployment

Tambahkan scripts deployment:

```json
{
  "scripts": {
    "dev": "node server/server.js",
    "start": "node server/server.js",
    "build": "cd client && npm install && npm run build",
    "postinstall": "cd server && npm install && cd ../client && npm install",
    "dev:frontend": "cd client && vite",
    "build:frontend": "cd client && vite build",
    "preview:frontend": "cd client && vite preview",
    "seed": "node server/scripts/seedDatabase.js",
    "create-admin": "node server/scripts/createAdminUser.js",
    "list-users": "node server/scripts/listAllUsers.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## 🌐 Custom Domain (Opsional)

### Railway / Render:

1. Buka project settings
2. Add custom domain
3. Update DNS records:
   ```
   Type: CNAME
   Name: @
   Value: your-app.up.railway.app
   ```

### Vercel:

1. Project Settings → Domains
2. Add domain
3. Update DNS A record

---

## 📊 Monitoring & Logs

### Railway:

- Dashboard → Metrics tab
- Logs tab untuk real-time logs

### Render:

- Dashboard → Logs
- Metrics untuk CPU/Memory usage

### PM2 (VPS):

```bash
pm2 logs absensi-backend
pm2 monit
pm2 status
```

---

## 🐛 Troubleshooting Deployment

### Error: "Module not found"

**Fix:**

```bash
# Pastikan postinstall script berjalan
npm run postinstall
```

### Error: "Cannot connect to database"

**Fix:** Check environment variables sudah set dengan benar

### Frontend tidak load

**Fix:**

- Check `client/dist` folder ada dan berisi files
- Verify `npm run build` berhasil
- Check server serve static files dari path yang benar

### API 404

**Fix:**

- Pastikan backend running
- Check CORS settings
- Verify `VITE_API_URL` di frontend environment

---

## 💰 Biaya Estimasi

| Platform     | Free Tier       | Paid                 |
| ------------ | --------------- | -------------------- |
| **Railway**  | $5 credit/month | $5/month per service |
| **Render**   | 750 hours/month | $7/month web service |
| **Vercel**   | Unlimited sites | $20/month Pro        |
| **VPS (DO)** | -               | $6/month (1GB RAM)   |

**Recommended untuk start:** Railway free tier atau Render free tier.

---

## 🚀 Quick Deploy Commands

```bash
# 1. Prepare
git add .
git commit -m "Production ready"
git push origin main

# 2. Test build locally
npm run build
npm start

# 3. Deploy
# → Push to GitHub
# → Railway/Render auto-deploy
# → Monitor logs

# 4. Seed production database (once)
# Via Railway shell atau Render shell:
npm run seed
npm run create-admin
```

---

## ✅ Post-Deployment

1. Test login di production URL
2. Test absensi feature
3. Test admin dashboard
4. Monitor logs untuk errors
5. Setup uptime monitoring (UptimeRobot, etc)

---

**Need help?** Check platform documentation:

- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
