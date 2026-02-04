# Railway Deployment Guide

## Prerequisites

- GitHub repository connected to Railway
- Supabase project with credentials ready

## Step 1: Create Environment Variables in Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Select the "server" service
4. Click **Variables** tab
5. Add these environment variables:

```env
SUPABASE_URL=https://pxrqmqelmpnnxgnofhwp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xT7r8Eb_gPX7KnmoLndQCg_r-wYbZrr
JWT_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwxyz
NODE_ENV=production
```

⚠️ **NEVER commit `.env` file to GitHub!** Use Railway's Variables feature instead.

## Step 2: Configure Node.js Version

Railway will automatically detect Node.js 20 from:

- `.node-version` file (contains `20.11.0`)
- `package.json` engines field (`"node": ">=20.0.0"`)

## Step 3: Deploy

### Option A: Auto-deploy from GitHub

- Push code to `main` branch
- Railway automatically builds and deploys

### Option B: Manual Deploy

1. In Railway dashboard, click service
2. Click "Deploy" button
3. Select `main` branch

## Step 4: Verify Deployment

Check logs:

```
railway logs
```

Should see:

```
Server running on http://0.0.0.0:PORT
Connected to Supabase ✓
```

## Troubleshooting

### Error: "SUPABASE_URL dan SUPABASE_ANON_KEY harus didefinisikan"

- ✅ Make sure variables are set in Railway dashboard (NOT in code)
- ✅ Redeploy after adding variables
- ✅ Check variable names are exact (case-sensitive)

### Error: "Node.js 18 and below are deprecated"

- ✅ Already fixed with `.node-version` file
- ✅ Railway will use Node.js 20.11.0 automatically

### Error: "npm ci" fails

- ✅ Lock files are regenerated and committed
- ✅ Delete old lock files if needed: `npm install` locally then push

## Port Configuration

Railway assigns a dynamic port via `$PORT` environment variable.
Server automatically uses this:

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

✅ No need to configure port manually!

## Frontend Deployment (Optional)

For frontend, use:

- **Vercel** (free) - recommended
- **Netlify** (free)
- **Railway** (as second backend - not recommended)

See [FREE_HOSTING.md](./FREE_HOSTING.md) for options.
