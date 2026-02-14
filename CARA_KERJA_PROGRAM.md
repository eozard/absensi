# Cara Kerja Program (Rinci)

Dokumen ini menjelaskan alur kerja aplikasi absensi dan izin secara rinci agar mudah dipelajari.

## Versi Awam (Singkat dan Mudah Dipahami)

Bayangkan aplikasi ini seperti buku hadir digital.

- Siswa login seperti mengambil kartu hadir pribadi.
- Saat absen pagi atau sore, sistem mencatat waktunya otomatis.
- Kalau tidak bisa hadir, siswa mengisi alasan izin.
- Admin (guru/petugas) bisa melihat semua data, menyetujui atau menolak izin.
- Di dashboard admin ada ringkasan: berapa siswa hadir hari ini dan berapa yang izin.

Intinya: siswa cukup login, pilih absen atau izin, lalu semua data tersimpan rapi. Admin tinggal memantau dan mengambil keputusan.

## 1. Gambaran Umum

Aplikasi terdiri dari dua bagian utama:

- Backend: Node.js/Express yang terhubung ke Supabase (PostgreSQL).
- Frontend: React (Vite) untuk UI admin dan mahasiswa.

Data utama disimpan di tabel `users`, `attendances`, dan `devices`.

## 2. Alur Login

1. Pengguna mengisi form login di UI.
2. Frontend mengirim kredensial ke endpoint `POST /auth/login`.
3. Backend memvalidasi user dan membuat JWT.
4. JWT dikembalikan ke frontend dan disimpan di `localStorage`.
5. Semua request berikutnya membawa token di header `Authorization`.

## 3. Alur Absensi (Mahasiswa)

1. Mahasiswa memilih sesi (pagi atau sore).
2. Frontend mengirim request `POST /auth/absen` dengan data sesi dan fingerprint perangkat.
3. Backend memeriksa:
   - Token valid.
   - Device binding sesuai user.
   - Belum ada absensi untuk sesi tersebut.
4. Backend menulis record ke tabel `attendances` dengan:
   - `status`: hadir
   - `jam_masuk`: waktu server
   - `sesi`: pagi atau sore
5. Frontend menampilkan status berhasil.

## 4. Alur Izin (Mahasiswa)

1. Mahasiswa mengisi alasan izin (keterangan).
2. Frontend mengirim request `POST /auth/izin`.
3. Backend membuat record `attendances` dengan:
   - `status`: izin
   - `status_approval`: pending
   - `keterangan`: alasan izin
   - `jam_masuk`: waktu server
4. Admin dapat menyetujui atau menolak izin.

## 5. Alur Persetujuan Izin (Admin)

1. Admin membuka tab report/izin.
2. Frontend memanggil `GET /admin/izin`.
3. Admin memilih aksi:
   - Setujui: `PATCH /admin/izin/:id` status_approval=approved
   - Tolak: `PATCH /admin/izin/:id` status_approval=rejected
4. UI memperbarui badge status.

## 6. Dashboard Admin (Stats)

Dashboard menampilkan ringkasan:

- Total mahasiswa.
- Total anak SMK.
- Hadir hari ini (per siswa unik).
- Izin hari ini (per siswa unik).

Perhitungan hadir dan izin dilakukan berdasarkan tanggal hari ini dan menghitung nama unik agar siswa yang absen pagi dan sore tidak dihitung dua kali.

## 7. Laporan Absensi (Report)

1. Admin memilih filter:
   - Tanggal awal dan akhir.
   - Kelompok.
   - Nama siswa.
2. Frontend memanggil `GET /admin/report` dengan query parameter.
3. Backend mengambil data dari tabel `attendances` sesuai filter.
4. Data ditampilkan dalam tabel dengan kolom:
   - Nama, Kelompok, Tanggal, Sesi, Jam Masuk, Status, Keterangan, Aksi.

## 8. Export Laporan

1. Admin klik tombol export.
2. Frontend membentuk data CSV.
3. CSV memakai delimiter `;` dan UTF-8 BOM agar cocok di Excel.

## 9. Device Binding

1. Saat login pertama, device fingerprint diikat ke user.
2. Login berikutnya hanya diizinkan dari device yang sama.
3. Admin dapat reset device binding jika perlu.

## 10. Struktur File Penting

- Backend:
  - `server/routes/auth.js`: login, absen, izin
  - `server/routes/admin.js`: stats, report, approval
  - `server/middleware/auth.js`: validasi JWT

- Frontend:
  - `client/src/pages/LoginPage.jsx`: UI login
  - `client/src/pages/MahasiswaDashboard.jsx`: UI absensi dan izin
  - `client/src/pages/AdminDashboard.jsx`: UI admin, stats, report

## 11. Detail Endpoint API

Bagian ini merangkum endpoint utama, input, dan output ringkasnya.

### Public

- `POST /api/login`
  - Body: `{ nama, password, deviceId }`
  - Response: `{ success, token, user }`

### Mahasiswa/Anak SMK (Token wajib)

- `POST /api/absen`
  - Body: `{ sesi, deviceId }`
  - Catatan: hanya dari WiFi kampus.
  - Response: `{ success, message }`

- `GET /api/riwayat`
  - Response: `{ success, data, summary }`

- `POST /api/izin`
  - Body: `{ keterangan }`
  - Response: `{ success, message, data }`

- `GET /api/izin`
  - Response: `{ success, data }`

- `DELETE /api/izin/:id`
  - Response: `{ success, message }`

### Admin (Token admin wajib)

- `GET /api/admin/stats`
  - Response: `{ success, stats }`

- `GET /api/admin/attendance-today`
  - Response: `{ success, data }`

- `GET /api/admin/students`
  - Response: `{ success, students }`

- `GET /api/admin/attendance/:nama`
  - Response: `{ success, data, summary }`

- `GET /api/admin/devices`
  - Response: `{ success, devices }`

- `DELETE /api/admin/devices/:deviceId`
  - Response: `{ success, message }`

- `GET /api/admin/users`
  - Response: `{ success, users }`

- `POST /api/admin/users`
  - Body: `{ nama, password, role, kelompok }`
  - Response: `{ success, message, user }`

- `POST /api/admin/users/:id/reset-password`
  - Body: `{ password }`
  - Response: `{ success, message }`

- `DELETE /api/admin/users/:id`
  - Response: `{ success, message }`

- `GET /api/admin/report`
  - Query: `fromDate`, `toDate`, `kelompok`, `nama`
  - Response: `{ success, data }`

- `GET /api/admin/izin`
  - Response: `{ success, data }`

- `PUT /api/admin/izin/:id`
  - Body: `{ status_approval }`
  - Response: `{ success, message }`

## 12. Ringkasan Alur Data

1. Frontend mengirim request ke backend via axios.
2. Backend memvalidasi token dan business logic.
3. Backend membaca atau menulis data ke Supabase.
4. Backend mengembalikan response JSON.
5. Frontend menampilkan hasil ke user.
