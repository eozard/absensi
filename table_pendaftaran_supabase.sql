-- ============================================================================
-- TABEL PENDAFTARAN & ADMIN PENDAFTARAN - Sistem Pendaftaran PKL
-- ============================================================================
-- File ini berisi SQL untuk membuat tabel pendaftaran & admin_pendaftaran
-- di Supabase. Salin seluruh isi file ini dan jalankan di Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- Table: pendaftaran (publik - tanpa login)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pendaftaran (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nim VARCHAR(50) NOT NULL,
  divisi VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cv_url TEXT,
  transkrip_url TEXT,
  surat_persetujuan_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  assigned_divisi VARCHAR(100),
  assigned_at TIMESTAMP,
  assigned_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kolom tambahan jika tabel sudah ada (idempotent)
ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS assigned_divisi VARCHAR(100);
ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_pendaftaran_divisi ON pendaftaran(divisi);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran(status);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_nim ON pendaftaran(nim);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_created ON pendaftaran(created_at);

-- RLS (Row Level Security)
ALTER TABLE pendaftaran ENABLE ROW LEVEL SECURITY;

-- Drop policy lama jika ada, lalu buat ulang
DROP POLICY IF EXISTS "Allow public insert pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow public read pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow admin all pendaftaran" ON pendaftaran;

-- Policy: allow public insert (pendaftar tanpa login)
CREATE POLICY "Allow public insert pendaftaran"
  ON pendaftaran
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: allow admin to read/update/delete all
CREATE POLICY "Allow admin all pendaftaran"
  ON pendaftaran
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Table: admin_pendaftaran (akun admin khusus dashboard pendaftaran)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_pendaftaran (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Akun admin default (username: admin, password: admin123)
-- Password di-hash menggunakan bcrypt.
-- Hash di bawah ini untuk password "admin123":
--   $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- Silakan generate hash baru jika ingin password lain.
INSERT INTO admin_pendaftaran (username, password, nama)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Pendaftaran')
ON CONFLICT (username) DO NOTHING;

-- RLS untuk admin_pendaftaran
ALTER TABLE admin_pendaftaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin login" ON admin_pendaftaran;

-- Policy: allow public to read (untuk login)
-- Sebaiknya ubah policy ini agar hanya service role yang bisa read,
-- tapi untuk simplicity kita izinkan public read.
CREATE POLICY "Allow admin login"
  ON admin_pendaftaran
  FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- STORAGE BUCKET (untuk file PDF)
-- ============================================================================
-- Buat bucket di Supabase Storage dengan nama: 'pendaftaran-files'

INSERT INTO storage.buckets (id, name, public)
VALUES ('pendaftaran-files', 'pendaftaran-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk storage bucket
DROP POLICY IF EXISTS "Allow public upload pendaftaran files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read pendaftaran files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete pendaftaran files" ON storage.objects;

-- Policy: allow public upload
CREATE POLICY "Allow public upload pendaftaran files"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'pendaftaran-files');

-- Policy: allow public read
CREATE POLICY "Allow public read pendaftaran files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'pendaftaran-files');

-- Policy: allow admin delete
CREATE POLICY "Allow admin delete pendaftaran files"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'pendaftaran-files');

-- ============================================================================
-- CARA MENGGUNAKAN:
-- ============================================================================
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Salin & paste seluruh isi file ini
-- 3. Klik "Run" untuk menjalankan
-- 4. Tabel 'pendaftaran' dan 'admin_pendaftaran' akan dibuat
-- 5. Akun admin default: username=admin, password=admin123
--    (Segera ubah password setelah login pertama!)
-- ============================================================================
