# FIX: Tambah Kolom Izin ke Attendances Table

## Masalah

Error 500 saat submit izin: `Database error`

**Root cause:** Tabel `attendances` tidak punya kolom untuk izin data:

- `keterangan`
- `bukti_url`
- `status_approval`
- `approved_by`
- `approved_at`

## Solusi

### Step 1: Buka Supabase SQL Editor

1. Login ke Supabase dashboard: https://app.supabase.com
2. Pilih project: **absensi-pkl-supabase**
3. Buka **SQL Editor** di sidebar kiri
4. Klik **New Query**

### Step 2: Copy & Paste SQL Migration

Copy semua SQL dari file:

```
📄 add_izin_columns_to_attendances.sql
```

Paste ke SQL Editor Supabase.

### Step 3: Execute Query

Klik tombol **▶ Run** (atau Ctrl+Enter)

Tunggu sampai selesai. Seharusnya melihat:

```
✅ Success
6 rows affected
```

### Step 4: Verify

Buka **Table Editor** di Supabase > pilih tabel **attendances**

Seharusnya sudah ada kolom baru:

- ✅ `keterangan` (TEXT)
- ✅ `bukti_url` (TEXT)
- ✅ `status_approval` (VARCHAR(50))
- ✅ `approved_by` (VARCHAR(255))
- ✅ `approved_at` (TIMESTAMPTZ)

### Step 5: Test

Sekarang coba submit izin lagi dari mahasiswa dashboard. Seharusnya 200 berhasil! ✅

## Jika Ada Error

- Jika error `column ... already exists`, itu OK, berarti columns sudah ada
- Jika error constraint, bisa diabaikan (DB mungkin sudah ada constraints itu)
- Jika tetap error 500, cek backend logs dengan `npm run dev` di folder `/server`
