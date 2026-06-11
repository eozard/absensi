-- Migration: Tabel Logbook Harian (terintegrasi dengan absensi)
-- Tujuan: Mahasiswa/anak_smk bisa menulis kegiatan harian PKL.
--         Tergabung dengan absensi: 1 entri logbook per nama per tanggal.
--         Jika user absen (hadir), boleh mengisi logbook. Jika tidak absen/izin,
--         user tetap boleh mengisi logbook "kegiatan dari rumah/penugasan".
--         Admin/pembimbing review & approve/reject dengan catatan.
--
-- Jalankan ini di Supabase SQL Editor SETELAH database.sql
-- dan add_izin_columns_to_attendances.sql sudah dijalankan.

-- ============================================================
-- Table: logbook_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS logbook_entries (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100),
  tanggal DATE NOT NULL,
  judul VARCHAR(255) NOT NULL,
  kegiatan TEXT NOT NULL,
  jam_mulai TIME,
  jam_selesai TIME,
  hasil TEXT,
  kendala TEXT,
  status VARCHAR(50) DEFAULT 'draft',     -- draft | submitted | approved | rejected
  status_approval VARCHAR(50) DEFAULT 'pending',  -- pending | approved | rejected (alias dari status untuk konsistensi dengan izin)
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  catatan_reviewer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT logbook_unique_per_day UNIQUE (nama, tanggal),
  CONSTRAINT logbook_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);

-- Indexes untuk query umum
CREATE INDEX IF NOT EXISTS idx_logbook_nama ON logbook_entries(nama);
CREATE INDEX IF NOT EXISTS idx_logbook_tanggal ON logbook_entries(tanggal);
CREATE INDEX IF NOT EXISTS idx_logbook_kelompok ON logbook_entries(kelompok);
CREATE INDEX IF NOT EXISTS idx_logbook_status ON logbook_entries(status);
CREATE INDEX IF NOT EXISTS idx_logbook_status_approval ON logbook_entries(status_approval);
CREATE INDEX IF NOT EXISTS idx_logbook_nama_tanggal ON logbook_entries(nama, tanggal DESC);

-- ============================================================
-- Disable RLS (sesuai pola fix_device_bindings_rls.sql)
-- ============================================================
ALTER TABLE logbook_entries DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Auto-update updated_at saat row di-UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION logbook_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_logbook_updated_at ON logbook_entries;
CREATE TRIGGER trg_logbook_updated_at
  BEFORE UPDATE ON logbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION logbook_set_updated_at();

-- ============================================================
-- View: Logbook harian yang sudah digabung dengan data absensi
-- Berguna untuk admin rekap "siapa hadir + kegiatan apa"
-- ============================================================
CREATE OR REPLACE VIEW v_logbook_with_attendance AS
SELECT
  l.id,
  l.nama,
  l.kelompok,
  l.tanggal,
  l.judul,
  l.kegiatan,
  l.jam_mulai,
  l.jam_selesai,
  l.hasil,
  l.kendala,
  l.status,
  l.status_approval,
  l.reviewed_by,
  l.reviewed_at,
  l.catatan_reviewer,
  l.created_at,
  l.updated_at,
  -- Status absensi user di tanggal tersebut
  (
    SELECT json_agg(json_build_object(
      'sesi', a.sesi,
      'status', a.status,
      'jam_masuk', a.jam_masuk,
      'status_approval', a.status_approval
    ) ORDER BY a.sesi)
    FROM attendances a
    WHERE a.nama = l.nama AND a.tanggal = l.tanggal
  ) AS absensi_info
FROM logbook_entries l;

-- Done! Tabel logbook siap dipakai.
-- Cara pakai: jalankan file ini di Supabase SQL Editor, lalu backend otomatis bisa query.
