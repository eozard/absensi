# Production Deployment Info

## 🚀 Live Application

**URL:** https://pkl4-production.up.railway.app
_(Update with actual Railway URL)_

## 📊 Status

- ✅ Deployed to Railway
- ✅ Node.js 20.11.0
- ✅ Supabase connected
- ✅ Environment variables configured

## 🔐 Admin Access

**Admin Dashboard:** https://pkl4-production.up.railway.app/admin

**Default Admin:**

- Username: (create dengan `npm run create-admin`)
- Role: admin

## 📡 API Endpoints

Base URL: `https://pkl4-production.up.railway.app/api`

### Authentication

- `POST /api/login` - Login mahasiswa/admin
- `GET /api/riwayat` - Get attendance history (requires auth)

### Attendance

- `POST /api/absen` - Submit attendance (requires auth, WiFi check)
- `POST /api/izin` - Submit izin (requires auth)

### Admin (requires admin role)

- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/mahasiswa` - List all students
- `GET /api/admin/devices` - List device bindings
- `DELETE /api/admin/devices/:id` - Delete device binding
- `GET /api/admin/izin` - List all izin requests
- `PUT /api/admin/izin/:id` - Update izin status

## 🔧 Maintenance

### View Logs

```bash
# Railway dashboard → Logs tab
# Or using CLI:
railway logs
```

### Redeploy

```bash
# Push to GitHub (auto-deploy):
git push origin main

# Or manual in Railway dashboard:
# Deployments → Deploy → Redeploy Latest
```

### Update Environment Variables

```bash
# Railway dashboard → Variables tab
# Update values → Auto redeploy
```

### Database Operations

```bash
# Create admin user:
npm run create-admin

# Seed database (local):
npm run seed

# List users:
npm run list-users
```

## 📊 Monitoring

### Check Application Health

- ✅ Frontend loads: https://pkl4-production.up.railway.app
- ✅ API responds: https://pkl4-production.up.railway.app/api
- ✅ Login works
- ✅ Attendance submission works

### Check Logs for Errors

Look for:

- `❌ Error:` - Application errors
- `500` - Server errors
- `401` - Authentication issues
- `403` - Authorization issues

### Database Health

- Supabase Dashboard: https://app.supabase.com
- Check table sizes, query performance

## 🐛 Common Issues

### Issue: Login fails

**Check:**

1. JWT_SECRET is set in Railway
2. Device binding exists in database
3. Password is correct (bcryptjs hash)

**Fix:**

```bash
# Reset device binding
npm run clearDeviceBindings
```

### Issue: WiFi check fails

**Options:**

1. Deploy with campus WiFi IP whitelist
2. Set `BYPASS_WIFI_CHECK=true` (development only)
3. Update `wifiKampus.js` with correct IP ranges

### Issue: Supabase connection error

**Check:**

1. SUPABASE_URL is correct
2. SUPABASE_ANON_KEY is correct
3. Supabase project is active

## 📈 Performance

- Response time: <500ms (target)
- Uptime: 99.9% (Railway SLA)
- Database queries: Optimized with indexes

## 🔄 Update Workflow

1. **Development:**

   ```bash
   # Make changes locally
   npm run dev
   ```

2. **Test:**

   ```bash
   # Test frontend
   cd client && npm run build

   # Test backend
   npm start
   ```

3. **Deploy:**

   ```bash
   git add .
   git commit -m "Feature: Something"
   git push origin main
   ```

4. **Verify:**
   - Check Railway logs
   - Test live URL
   - Monitor for errors

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** https://github.com/farhan55/pkl4/issues

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
