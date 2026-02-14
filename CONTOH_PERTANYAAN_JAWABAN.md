# Contoh Pertanyaan dan Jawaban (Ujian Dosen)

Dokumen ini berisi contoh pertanyaan yang mungkin ditanyakan dosen beserta jawaban singkatnya.

## 1. Gambaran Umum Sistem

**Q:** Apa tujuan utama aplikasi ini?

**A:** Untuk mencatat absensi siswa secara digital dan rapi, serta mengelola izin secara terstruktur dengan persetujuan admin.

**Q:** Siapa saja pengguna sistem?

**A:** Mahasiswa/anak SMK sebagai pengguna utama, dan admin sebagai pengelola.

**Q:** Kenapa menggunakan backend dan frontend terpisah?

**A:** Backend menjaga keamanan dan data resmi, frontend menyediakan tampilan yang mudah dipakai.

## 2. Alur Login dan Keamanan

**Q:** Bagaimana proses login bekerja?

**A:** User mengirim nama, password, dan deviceId. Backend memvalidasi dan mengembalikan token JWT.

**Q:** Kenapa perlu device binding?

**A:** Agar akun tidak dipakai di banyak perangkat dan mencegah penyalahgunaan.

**Q:** Kenapa waktu absensi diatur server?

**A:** Supaya jam absensi tidak bisa dimanipulasi dari perangkat user.

## 3. Absensi dan Izin

**Q:** Apa yang terjadi saat siswa absen?

**A:** Sistem menyimpan data hadir (nama, sesi, jam masuk, tanggal) ke database.

**Q:** Apa perbedaan absen hadir dan izin?

**A:** Hadir mencatat kehadiran, izin mencatat ketidakhadiran dengan alasan.

**Q:** Bagaimana izin diproses?

**A:** Siswa mengisi alasan, data masuk dengan status pending, admin bisa setujui atau tolak.

## 4. Dashboard Admin

**Q:** Data apa yang tampil di dashboard admin?

**A:** Statistik ringkas (total siswa, hadir hari ini, izin hari ini) dan laporan absensi.

**Q:** Kenapa hadir dihitung per siswa, bukan per sesi?

**A:** Agar siswa yang absen pagi dan sore tidak dihitung dua kali.

**Q:** Bagaimana filter laporan bekerja?

**A:** Admin memilih rentang tanggal, kelompok, dan nama untuk memfilter data.

## 5. Export Data

**Q:** Kenapa hasil export pakai CSV?

**A:** CSV mudah dibuka di Excel dan ringan untuk laporan.

**Q:** Kenapa CSV memakai delimiter titik koma?

**A:** Agar sesuai format Excel pada regional Indonesia.

## 6. Database dan Struktur Data

**Q:** Tabel utama apa saja di database?

**A:** `users` untuk data akun, `attendances` untuk absensi/izin, dan `devices` untuk device binding.

**Q:** Apa isi tabel attendances?

**A:** Nama, kelompok, tanggal, sesi, jam masuk, status, dan keterangan izin.

## 7. Pengujian dan Validasi

**Q:** Bagaimana cara memastikan absensi tidak dobel?

**A:** Backend mengecek apakah siswa sudah absen di sesi yang sama pada tanggal itu.

**Q:** Apa yang terjadi jika siswa mencoba login di device lain?

**A:** Sistem menolak login jika device tidak terdaftar.
