/*
 * ============================================================================
 * ROUTES: LOGBOOK HARIAN (terintegrasi dengan absensi)
 * ============================================================================
 * File ini berisi endpoint untuk:
 * 1. GET    /api/logbook/today     -> Logbook hari ini (auto-create draft)
 * 2. GET    /api/logbook?date=...  -> Logbook tanggal tertentu
 * 3. GET    /api/logbook/history   -> Riwayat logbook user (default 30 hari)
 * 4. PUT    /api/logbook/:id       -> Update entry (draft/submitted)
 * 5. POST   /api/logbook/:id/submit  -> Submit draft (draft -> submitted)
 * 6. DELETE /api/logbook/:id       -> Hapus entry (hanya draft, milik sendiri)
 *
 * ADMIN:
 * 7. GET    /api/admin/logbook     -> List semua (filter by nama/kelompok/tanggal/status)
 * 8. GET    /api/admin/logbook/:id -> Detail 1 entry
 * 9. PUT    /api/admin/logbook/:id/review -> Approve/reject + catatan
 * 10.GET    /api/admin/logbook/stats    -> Statistik logbook (pending/today/etc)
 * ============================================================================
 */

import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const KELOMPOK_OPTIONS = [
  "machine learning",
  "software engineering",
  "jaringan",
  "desain komunikasi visual",
];

const getJakartaDate = () => {
  const now = new Date();
  const jakarta = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return jakarta.toISOString().split("T")[0];
};

/* ============================================================================
 * HELPER: Cek apakah user boleh membuat logbook di tanggal X
 * (tidak ada batasan ketat: logbook boleh ditulis kapan saja,
 *  tapi biasanya ditulis di hari yang sama atau H+1)
 * ========================================================================== */
const isFutureDate = (tanggal) => {
  const today = getJakartaDate();
  return tanggal > today;
};

/* ============================================================================
 * HELPER: Ambil info absensi user di tanggal tertentu
 * ========================================================================== */
const getAttendanceInfo = async (nama, tanggal) => {
  const { data } = await supabase
    .from("attendances")
    .select("sesi, status, jam_masuk, status_approval")
    .eq("nama", nama)
    .eq("tanggal", tanggal)
    .order("sesi");
  return data || [];
};

/* ============================================================================
 * GET /api/logbook/today
 * Ambil/auto-create logbook hari ini untuk user yang login
 * ========================================================================== */
router.get("/logbook/today", async (req, res) => {
  try {
    const { nama, kelompok } = req.user;
    const today = getJakartaDate();

    const { data: existing } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("nama", nama)
      .eq("tanggal", today)
      .maybeSingle();

    const attendanceInfo = await getAttendanceInfo(nama, today);

    if (existing) {
      return res.json({
        success: true,
        data: { ...existing, absensi_info: attendanceInfo },
        isNew: false,
      });
    }

    return res.json({
      success: true,
      data: {
        id: null,
        nama,
        kelompok,
        tanggal: today,
        judul: "",
        kegiatan: "",
        jam_mulai: null,
        jam_selesai: null,
        hasil: "",
        kendala: "",
        status: "draft",
        status_approval: "pending",
        absensi_info: attendanceInfo,
      },
      isNew: true,
    });
  } catch (error) {
    console.error("Get logbook today error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * GET /api/logbook?date=YYYY-MM-DD
 * Ambil logbook user di tanggal tertentu
 * ========================================================================== */
router.get("/logbook", async (req, res) => {
  try {
    const { nama, kelompok } = req.user;
    const { date } = req.query;
    const targetDate = date || getJakartaDate();

    const { data, error } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("nama", nama)
      .eq("tanggal", targetDate)
      .maybeSingle();

    if (error) {
      console.error("Get logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const attendanceInfo = await getAttendanceInfo(nama, targetDate);

    return res.json({
      success: true,
      data: data
        ? { ...data, absensi_info: attendanceInfo }
        : {
            id: null,
            nama,
            kelompok,
            tanggal: targetDate,
            judul: "",
            kegiatan: "",
            jam_mulai: null,
            jam_selesai: null,
            hasil: "",
            kendala: "",
            status: "draft",
            status_approval: "pending",
            absensi_info: attendanceInfo,
          },
    });
  } catch (error) {
    console.error("Get logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * GET /api/logbook/history?days=30
 * Riwayat logbook user (untuk tab "Riwayat Logbook")
 * ========================================================================== */
router.get("/logbook/history", async (req, res) => {
  try {
    const { nama } = req.user;
    const days = parseInt(req.query.days) || 30;

    const { data, error } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("nama", nama)
      .order("tanggal", { ascending: false })
      .limit(days);

    if (error) {
      console.error("Get logbook history error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Get logbook history error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * PUT /api/logbook/:id
 * Update entry logbook. Hanya boleh edit jika status = draft atau rejected.
 * ========================================================================== */
router.put("/logbook/:id", async (req, res) => {
  try {
    const { nama } = req.user;
    const { id } = req.params;
    const { judul, kegiatan, jam_mulai, jam_selesai, hasil, kendala } = req.body;

    if (!judul || !kegiatan) {
      return res.status(400).json({
        success: false,
        message: "Judul dan kegiatan wajib diisi",
      });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("id", id)
      .eq("nama", nama)
      .maybeSingle();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Logbook tidak ditemukan",
      });
    }

    if (!["draft", "rejected"].includes(existing.status)) {
      return res.status(403).json({
        success: false,
        message: `Logbook berstatus "${existing.status}" tidak bisa diedit`,
      });
    }

    const { data, error } = await supabase
      .from("logbook_entries")
      .update({
        judul,
        kegiatan,
        jam_mulai: jam_mulai || null,
        jam_selesai: jam_selesai || null,
        hasil: hasil || null,
        kendala: kendala || null,
        status: "draft", // kembali ke draft setelah edit
        status_approval: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, message: "Logbook diperbarui", data });
  } catch (error) {
    console.error("Update logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * POST /api/logbook
 * Create logbook baru (untuk tanggal tertentu, biasanya hari ini)
 * ========================================================================== */
router.post("/logbook", async (req, res) => {
  try {
    const { nama, kelompok } = req.user;
    const {
      tanggal,
      judul,
      kegiatan,
      jam_mulai,
      jam_selesai,
      hasil,
      kendala,
    } = req.body;

    if (!tanggal || !judul || !kegiatan) {
      return res.status(400).json({
        success: false,
        message: "Tanggal, judul, dan kegiatan wajib diisi",
      });
    }

    if (isFutureDate(tanggal)) {
      return res.status(400).json({
        success: false,
        message: "Tidak boleh membuat logbook untuk tanggal yang akan datang",
      });
    }

    const { data: existing } = await supabase
      .from("logbook_entries")
      .select("id")
      .eq("nama", nama)
      .eq("tanggal", tanggal)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Logbook untuk tanggal ini sudah ada. Gunakan PUT untuk update.",
        existingId: existing.id,
      });
    }

    const { data, error } = await supabase
      .from("logbook_entries")
      .insert({
        nama,
        kelompok,
        tanggal,
        judul,
        kegiatan,
        jam_mulai: jam_mulai || null,
        jam_selesai: jam_selesai || null,
        hasil: hasil || null,
        kendala: kendala || null,
        status: "draft",
        status_approval: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, message: "Logbook dibuat", data });
  } catch (error) {
    console.error("Create logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * POST /api/logbook/:id/submit
 * Submit draft -> submitted (siap di-review admin)
 * ========================================================================== */
router.post("/logbook/:id/submit", async (req, res) => {
  try {
    const { nama } = req.user;
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("id", id)
      .eq("nama", nama)
      .maybeSingle();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Logbook tidak ditemukan",
      });
    }

    if (!["draft", "rejected"].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: `Logbook berstatus "${existing.status}" tidak bisa disubmit lagi`,
      });
    }

    if (!existing.judul || !existing.kegiatan) {
      return res.status(400).json({
        success: false,
        message: "Judul dan kegiatan harus diisi sebelum submit",
      });
    }

    const { data, error } = await supabase
      .from("logbook_entries")
      .update({
        status: "submitted",
        status_approval: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Submit logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, message: "Logbook disubmit untuk review", data });
  } catch (error) {
    console.error("Submit logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * DELETE /api/logbook/:id
 * Hapus entry (hanya draft, hanya milik sendiri)
 * ========================================================================== */
router.delete("/logbook/:id", async (req, res) => {
  try {
    const { nama } = req.user;
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("id", id)
      .eq("nama", nama)
      .maybeSingle();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Logbook tidak ditemukan",
      });
    }

    if (existing.status !== "draft") {
      return res.status(403).json({
        success: false,
        message: "Hanya logbook berstatus draft yang bisa dihapus",
      });
    }

    const { error } = await supabase
      .from("logbook_entries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, message: "Logbook dihapus" });
  } catch (error) {
    console.error("Delete logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================================
 * ADMIN ROUTES
 * ============================================================================
 * Catatan: endpoint /api/admin/logbook/* dipasang di server.js dengan
 * middleware verifyToken + isAdmin. Di sini kita ekspor handler-nya dan
 * router utama akan me-mount di path yang sesuai.
 * ========================================================================== */

/* GET /api/admin/logbook
 * List semua logbook dengan filter: nama, kelompok, tanggal, status
 */
export const adminListLogbook = async (req, res) => {
  try {
    const { nama, kelompok, fromDate, toDate, status } = req.query;

    let query = supabase
      .from("logbook_entries")
      .select("*")
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false });

    if (nama) query = query.eq("nama", nama);
    if (kelompok && kelompok !== "all") query = query.eq("kelompok", kelompok);
    if (fromDate) query = query.gte("tanggal", fromDate);
    if (toDate) query = query.lte("tanggal", toDate);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      console.error("Admin list logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Admin list logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* GET /api/admin/logbook/stats
 * Statistik ringkas untuk kartu dashboard admin
 */
export const adminLogbookStats = async (req, res) => {
  try {
    const today = getJakartaDate();

    const { data: all, error } = await supabase
      .from("logbook_entries")
      .select("id, nama, status, tanggal");

    if (error) {
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const stats = {
      totalEntries: all?.length || 0,
      todayEntries: all?.filter((e) => e.tanggal === today).length || 0,
      pending: all?.filter((e) => e.status === "submitted").length || 0,
      approved: all?.filter((e) => e.status === "approved").length || 0,
      rejected: all?.filter((e) => e.status === "rejected").length || 0,
      draft: all?.filter((e) => e.status === "draft").length || 0,
    };

    return res.json({ success: true, stats });
  } catch (error) {
    console.error("Admin logbook stats error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* GET /api/admin/logbook/:id
 * Detail 1 entry + info absensi
 */
export const adminGetLogbook = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ success: false, message: "Logbook tidak ditemukan" });
    }

    const attendanceInfo = await getAttendanceInfo(data.nama, data.tanggal);

    return res.json({
      success: true,
      data: { ...data, absensi_info: attendanceInfo },
    });
  } catch (error) {
    console.error("Admin get logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* PUT /api/admin/logbook/:id/review
 * Approve atau reject + catatan reviewer
 */
export const adminReviewLogbook = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan_reviewer } = req.body;
    const adminName = req.user.nama;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status harus 'approved' atau 'rejected'",
      });
    }

    const { data, error } = await supabase
      .from("logbook_entries")
      .update({
        status,
        status_approval: status,
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString(),
        catatan_reviewer: catatan_reviewer || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin review logbook error:", error.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: "Logbook tidak ditemukan" });
    }

    return res.json({
      success: true,
      message: `Logbook berhasil di${status === "approved" ? "setujui" : "tolak"}`,
      data,
    });
  } catch (error) {
    console.error("Admin review logbook error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default router;
