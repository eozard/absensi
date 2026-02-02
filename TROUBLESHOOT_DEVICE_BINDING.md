# Troubleshoot Device Bindings - Tidak Masuk ke Database

## Diagnosis Masalah

Berdasarkan analisis kode, ada beberapa kemungkinan penyebab data device_bindings tidak masuk ke Supabase:

### 1. **RLS (Row Level Security) - PALING MUNGKIN**

Di Supabase, RLS enabled by default pada semua table. Jika tidak ada policy yang tepat, INSERT/UPDATE akan ditolak.

**Cara cek:**

- Buka Supabase dashboard
- Pergi ke SQL Editor
- Jalankan: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'device_bindings';`
- Jika `rowsecurity = true` tapi tidak ada policy, itu masalahnya!

### 2. **Supabase Service Role vs Authenticated Role**

Backend menggunakan service role key (dari environment variable), tapi jika policy hanya allow authenticated role, bisa ditolak.

### 3. **Console Errors di Backend**

Cek apakah ada error di console ketika login/bind device.

---

## SOLUSI CEPAT

### Opsi 1: Disable RLS (Paling Mudah - untuk development)

1. Buka Supabase Dashboard
2. Go to SQL Editor
3. Jalankan query ini:

```sql
ALTER TABLE device_bindings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE izin DISABLE ROW LEVEL SECURITY;
```

4. Test login ulang

### Opsi 2: Enable RLS dengan Proper Policies (Recommended untuk Production)

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE device_bindings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "device_bindings_policy_all" ON device_bindings;

-- Create single policy for all operations
CREATE POLICY "device_bindings_policy_all" ON device_bindings
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Same untuk tables lain
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_policy_all" ON users;
CREATE POLICY "users_policy_all" ON users
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendances_policy_all" ON attendances;
CREATE POLICY "attendances_policy_all" ON attendances
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE izin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "izin_policy_all" ON izin;
CREATE POLICY "izin_policy_all" ON izin
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);
```

---

## CARA DEBUG LEBIH LANJUT

### 1. Cek Backend Logs

Jalankan backend dan perhatikan console output saat login:

```
npm run dev
```

Cari logs yang berisi:

- `✅ Device baru terbind` = SUCCESS
- `❌ Error binding device` = ERROR (lihat error message-nya)

### 2. Cek Supabase Logs

1. Buka Supabase Dashboard
2. Pergi ke Logs > Database
3. Filter by `device_bindings`
4. Lihat error messages

### 3. Test Direct Insert di Supabase

Di SQL Editor, coba insert manual:

```sql
INSERT INTO device_bindings (device_id, user_name, kelompok)
VALUES ('test_device_123', 'testuser', 'kelompok1');
```

Jika error RLS, maka itu pasti masalahnya.

---

## CHECKLIST FIX

- [ ] Cek RLS status di Supabase
- [ ] Disable RLS atau Create proper policies
- [ ] Test login ulang
- [ ] Verify data masuk ke device_bindings table
- [ ] Cek server logs untuk error messages

---

## DEBUGGING: Enable More Logging

Jika perlu debug lebih, tambahkan ini di `backend/routes/auth.js` sebelum insert device_bindings:

```javascript
console.log("🔍 About to insert device binding:", {
  device_id: deviceId,
  user_name: nama,
  kelompok: user.kelompok,
});

const { data: bindData, error: bindError } = await supabase
  .from("device_bindings")
  .insert({...})
  .select();

if (bindError) {
  console.error(
    "❌ FULL ERROR DETAILS:",
    JSON.stringify({
      message: bindError.message,
      code: bindError.code,
      details: bindError.details,
      hint: bindError.hint,
    }, null, 2)
  );
}
```

---

## NOTES

- Device ID dibuat di frontend dengan `fingerprint.js`
- Format: `device_[browserId]` (tanpa timestamp di getDeviceIdSync)
- Di loginPage.jsx dan MahasiswaDashboard.jsx menggunakan `getDeviceIdSync()`
- Backend menerima via request body `deviceId`
- Insert ke `device_bindings` terjadi di `backend/routes/auth.js` line ~140
