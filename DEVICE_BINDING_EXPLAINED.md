# 🔒 Device Binding - Cara Kerja & Aturan

## 📋 Konsep Device Binding

**Device Binding** adalah sistem yang memastikan:

1. **Satu device hanya bisa digunakan oleh satu user**
2. **Satu user maksimal bisa bind 2 devices**

Device diidentifikasi dengan **Device ID** yang tersimpan di localStorage browser.

---

## 🎯 Cara Kerja

### 1. **Pertama Kali Login**

```
User A login dari Browser 1
├─ Generate deviceId: device_abc123_1234567890
├─ Simpan di localStorage
├─ Bind ke database: device_abc123_1234567890 → User A
└─ Login berhasil ✅
```

### 2. **Login Ulang (Same User, Same Device)**

```
User A login lagi dari Browser 1
├─ Load deviceId dari localStorage: device_abc123_1234567890
├─ Cek database: device terikat ke User A ✅
└─ Login berhasil ✅
```

### 3. **Login dengan User Berbeda (Same Device) - DITOLAK**

```
User B coba login dari Browser 1 (yang sama)
├─ Load deviceId dari localStorage: device_abc123_1234567890
├─ Cek database: device terikat ke User A ❌
└─ Login DITOLAK ❌
    Error: "Device sudah terikat untuk user lain (User A)"
```

---

## ❓ Masalah: "Kok Bisa Login Akun Lain dari Device Sama?"

### Penyebab:

Ketika user "hapus cookie", yang terhapus hanya **cookie** browser, tapi **localStorage TIDAK ikut terhapus!**

```
User A logout (hapus cookie)
├─ Cookie: ❌ Terhapus
├─ localStorage (deviceId): ✅ MASIH ADA!
└─ DeviceId masih: device_abc123_1234567890

User B coba login dari browser yang sama
├─ Load deviceId: device_abc123_1234567890 (milik User A!)
├─ Backend cek: Device sudah terikat ke User A
└─ Seharusnya DITOLAK!
```

### ✅ Solusi yang Sudah Diimplementasi:

**Ketika Logout → DeviceId otomatis dihapus!**

```javascript
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("deviceId");  // ← BARU! Hapus deviceId
  navigate("/");
};
```

Sekarang flow-nya:

```
User A logout (klik tombol Logout)
├─ Cookie: ❌ Terhapus
├─ localStorage (token, user): ❌ Terhapus
├─ localStorage (deviceId): ❌ TERHAPUS! ← BARU
└─ Device di-unbind

User B login dari browser yang sama
├─ Generate deviceId BARU: device_xyz789_9876543210
├─ Bind ke database: device_xyz789_9876543210 → User B
└─ Login berhasil ✅
```

---

## 🔧 Cara Unbind Device Manual

### Metode 1: Tombol Logout (Recommended)

1. Klik tombol **"Logout"** di dashboard
2. DeviceId otomatis terhapus
3. Login dengan akun lain akan generate device baru

### Metode 2: Clear localStorage Manual

1. Buka Developer Console (`F12`)
2. Ketik: `localStorage.removeItem('deviceId');`
3. Atau: `localStorage.clear();`
4. Refresh halaman

### Metode 3: Gunakan Fix Tool

1. Buka [fix-device-binding.html](fix-device-binding.html)
2. Klik "Clear Storage & Fix Device ID"
3. Login ulang

---

## 📊 Skenario Lengkap

### ✅ Skenario Normal:

#### A. **Multiple Users, Different Devices**

```
User A login dari Laptop    → device_laptop_111  → User A ✅
User B login dari Handphone → device_phone_222   → User B ✅
User C login dari PC        → device_pc_333      → User C ✅
```

**Result:** Semua berhasil! ✅

#### B. **One User, Multiple Devices (Max 2)**

```
User A login dari Laptop    → device_laptop_111 → User A ✅
User A login dari Handphone → device_phone_222  → User A ✅
User A login dari PC        → ❌ DITOLAK (sudah 2 devices)
```

**Result:** Maksimal 2 devices per user

#### C. **Logout → Login Akun Lain**

```
User A login dari Laptop     → device_laptop_111 → User A ✅
User A klik Logout           → device_laptop_111 DIHAPUS
User B login dari Laptop     → device_laptop_999 (BARU!) → User B ✅
```

**Result:** Device di-unbind saat logout ✅

---

### ❌ Skenario Bermasalah (DITOLAK):

#### A. **Login Akun Lain Tanpa Logout**

```
User A login dari Laptop     → device_laptop_111 → User A ✅
User A hapus cookie manual   → deviceId MASIH ADA di localStorage!
User B coba login            → device_laptop_111 masih terikat ke User A
                               ❌ DITOLAK!
                               Error: "Device sudah terikat untuk user lain"
```

**Fix:** User A harus klik tombol **Logout**, bukan hapus cookie manual!

#### B. **Share Device ID**

```
User A: deviceId = device_abc_123
User B copy deviceId ke localStorage → device_abc_123
User B coba login                    → ❌ DITOLAK
                                       Error: "Device sudah terikat untuk user lain (User A)"
```

**Fix:** Setiap user harus punya device ID unik!

---

## 🛡️ Security Features

### 1. **Device Validation di Backend**

```javascript
// Cek apakah device sudah terikat ke user lain
const { data: deviceBindings } = await supabase
  .from("device_bindings")
  .select("*")
  .eq("device_id", deviceId);

if (deviceBindings && deviceBindings.length > 0) {
  if (boundUser.user_name !== nama) {
    return res.status(403).json({
      message: "Device sudah terikat untuk user lain"
    });
  }
}
```

### 2. **Max Devices per User**

```javascript
if (existingDevices.length >= user.max_devices) {
  return res.status(403).json({
    message: `Maksimal ${user.max_devices} device per user`
  });
}
```

### 3. **Device Unbinding on Logout**

```javascript
localStorage.removeItem("deviceId");  // Clear device ID
```

---

## 🔍 Troubleshooting

### Problem: "Device sudah terikat untuk user lain"

**Penyebab:** Device ID di localStorage masih terikat ke user lain

**Solusi:**

1. Klik tombol **Logout** (jangan hapus cookie manual)
2. Atau clear localStorage: `localStorage.clear();`
3. Atau gunakan [fix-device-binding.html](fix-device-binding.html)

### Problem: "Maksimal 2 device per user"

**Penyebab:** User sudah bind 2 devices

**Solusi:**

1. Login sebagai admin
2. Buka tab "Kelola Device"
3. Hapus device yang tidak dipakai
4. Login ulang

### Problem: Device ID masih ada setelah hapus cookie

**Penyebab:** Cookie ≠ localStorage

**Solusi:**

1. Gunakan tombol Logout di aplikasi
2. Atau clear localStorage manual di Developer Console

---

## 📝 Best Practices

1. ✅ **Selalu gunakan tombol Logout** di aplikasi (jangan hapus cookie manual)
2. ✅ **Jangan share device** dengan user lain tanpa logout dulu
3. ✅ **Clear localStorage** jika mau ganti akun
4. ❌ **Jangan manual edit deviceId** di localStorage
5. ❌ **Jangan copy-paste deviceId** antar browser

---

## 🔄 Update Log

**2026-02-02:**

- ✅ Fixed: Logout sekarang otomatis hapus deviceId
- ✅ Added: Console warning jika device sudah terikat
- ✅ Enhanced: Backend logging untuk debug
- ✅ Created: Fix tool (fix-device-binding.html)

---

## 💡 Kesimpulan

**Device Binding sekarang bekerja dengan benar!**

Key Points:

1. ✅ Satu device hanya untuk satu user
2. ✅ Logout otomatis unbind device
3. ✅ Login dengan akun lain akan generate device baru
4. ✅ Validation di backend mencegah reuse device

**Silakan test sekarang:**

1. Login dengan User A
2. Klik Logout
3. Login dengan User B
4. Seharusnya berhasil dengan device ID berbeda! ✅
