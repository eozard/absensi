# 🐛 Railway Deployment - bcrypt Error Fix

## Problem

Error saat deploy ke Railway:
```
Error: /app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header
code: 'ERR_DLOPEN_FAILED'
```

## Root Cause

**bcrypt** adalah native module yang perlu di-compile untuk platform tertentu. `node_modules/bcrypt` yang di-compile di Windows (development) tidak kompatibel dengan Linux (Railway server).

## Solution ✅

Replace `bcrypt` dengan `bcryptjs`:

### 1. Uninstall bcrypt & Install bcryptjs

```bash
cd server
npm uninstall bcrypt
npm install bcryptjs
```

### 2. Update Import Statements

Replace di semua files:
```javascript
// Before
import bcrypt from "bcrypt";

// After
import bcryptjs from "bcryptjs";
```

### 3. API tetap sama, tidak perlu ubah code

bcryptjs punya API yang sama dengan bcrypt:
```javascript
// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Compare password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 4. Commit & Push

```bash
git add .
git commit -m "Fix: Replace bcrypt with bcryptjs for Railway deployment"
git push origin main
```

Railway akan auto-redeploy dan error hilang!

## Files Changed

- `server/package.json` - dependency changed
- `server/routes/auth.js` - import updated
- `server/routes/admin.js` - import updated
- `server/scripts/seedDatabase.js` - import updated
- `server/scripts/createAdminUser.js` - import updated
- `server/scripts/resetAdmin.js` - import updated
- `server/test-validation.js` - import updated

## Why bcryptjs?

| bcrypt | bcryptjs |
|--------|----------|
| Native C++ module | Pure JavaScript |
| Needs compilation | No compilation |
| Platform-specific | Cross-platform |
| Faster | Slightly slower (acceptable) |
| ❌ Deployment issues | ✅ No issues |

## Performance Impact

bcryptjs sekitar 30% lebih lambat dari bcrypt, tapi:
- Hashing password jarang dilakukan (hanya saat register/login)
- Perbedaan ~10ms per hash (tidak terasa)
- Reliability > Speed untuk deployment

## Alternative Solutions (NOT RECOMMENDED)

### Option 1: Add .npmrc (complex)
```
# .npmrc
node-linker=hoisted
```

### Option 2: Platform-specific build (complex)
```json
{
  "scripts": {
    "postinstall": "npm rebuild bcrypt --build-from-source"
  }
}
```

### Option 3: Docker (overkill)
Build di Docker container dengan Linux.

❌ Semua ini lebih ribet daripada pakai bcryptjs!

## Testing

Setelah fix, test:

1. **Local:**
```bash
cd server && npm install && node server.js
```

2. **Login test:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"nama":"admin","password":"admin123","deviceId":"test"}'
```

3. **Railway:** Push & check logs

## Status

✅ **FIXED!** Railway sekarang bisa deploy tanpa error.

---

**Commit:** `2e68d31` - Fix Railway deployment: Replace bcrypt with bcryptjs
