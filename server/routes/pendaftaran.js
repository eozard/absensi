/*
 * ============================================================================
 * ROUTES: PENDAFTARAN PKL
 * ============================================================================
 * File ini berisi endpoint untuk:
 * 1. POST /api/pendaftaran          - Submit pendaftaran (publik, tanpa login)
 * 2. GET  /api/pendaftaran          - List pendaftar (publik/admin)
 * 3. PUT  /api/pendaftaran/:id      - Update assigned_divisi (admin)
 * 4. DELETE /api/pendaftaran/:id    - Hapus pendaftar (admin)
 * 5. POST /api/admin-pendaftaran/login - Login admin dashboard
 *
 * CATATAN:
 * - Pendaftaran publik, siapa saja bisa submit tanpa login
 * - Hanya admin_pendaftaran yang bisa update divisi & hapus pendaftar
 * ============================================================================
 */

import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Hanya file PDF yang diperbolehkan"));
    }
  },
});

const getJWTSecret = () => {
  return (
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-min-32-characters-long-here"
  );
};

const DIVISI_VALID = [
  "Networking",
  "Software Engineer",
  "Multimedia",
  "Artificial Intelligence",
  "Data Analyst",
];

const PRIORITY_LIMIT = 30;

/*
 * ============================================================================
 * ENDPOINT: POST /api/pendaftaran
 * ============================================================================
 * Submit pendaftaran baru. Publik, tanpa autentikasi.
 *
 * REQUEST: multipart/form-data
 * - nama: string
 * - nim: string
 * - divisi: string (salah satu dari DIVISI_VALID)
 * - email: string
 * - cv: file (PDF)
 * - transkrip: file (PDF)
 * - surat_persetujuan: file (PDF)
 * ============================================================================
 */
export const submitPendaftaran = async (req, res) => {
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "transkrip", maxCount: 1 },
    { name: "surat_persetujuan", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { nama, nim, divisi, email } = req.body;

      if (!nama || !nim || !divisi || !email) {
        return res.status(400).json({
          success: false,
          message: "Nama, NIM, divisi, dan email wajib diisi",
        });
      }

      if (!DIVISI_VALID.includes(divisi)) {
        return res.status(400).json({
          success: false,
          message: "Divisi tidak valid",
        });
      }

      if (
        !req.files?.cv?.[0] ||
        !req.files?.transkrip?.[0] ||
        !req.files?.surat_persetujuan?.[0]
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Semua file PDF (CV, Transkrip, Surat Persetujuan) wajib diunggah",
        });
      }

      const uploadFile = async (file, folder) => {
        const fileName = `${folder}/${nim}_${Date.now()}_${file.originalname}`;
        const { data, error } = await supabase.storage
          .from("pendaftaran-files")
          .upload(fileName, file.buffer, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (error) throw new Error(`Gagal upload ${folder}: ${error.message}`);
        const { data: urlData } = supabase.storage
          .from("pendaftaran-files")
          .getPublicUrl(data.path);
        return urlData.publicUrl;
      };

      const cv_url = await uploadFile(req.files.cv[0], "cv");
      const transkrip_url = await uploadFile(req.files.transkrip[0], "transkrip");
      const surat_persetujuan_url = await uploadFile(
        req.files.surat_persetujuan[0],
        "surat_persetujuan",
      );

      const { data, error } = await supabase
        .from("pendaftaran")
        .insert([
          {
            nama,
            nim,
            divisi,
            email,
            cv_url,
            transkrip_url,
            surat_persetujuan_url,
          },
        ])
        .select();

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Gagal menyimpan data pendaftaran: " + error.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Pendaftaran berhasil dikirim",
        data: data[0],
      });
    } catch (error) {
      console.error("Submit pendaftaran error:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server: " + error.message,
      });
    }
  });
};

/*
 * ============================================================================
 * ENDPOINT: GET /api/pendaftaran
 * ============================================================================
 * Ambil list semua pendaftar (urutan paling awal daftar → akhir).
 *
 * QUERY PARAMS:
 * - status: 'priority' | 'excess' | 'all' (default: all)
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: [...],
 *   total: number,
 *   priority: [...],  // 30 pendaftar paling awal
 *   excess: [...],    // sisanya
 *   priorityLimit: 30
 * }
 * ============================================================================
 */
export const getPendaftaran = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pendaftaran")
      .select("*")
      .order("created_at", { ascending: true }); // paling awal → akhir

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data pendaftaran: " + error.message,
      });
    }

    const total = data.length;
    const priority = data.slice(0, PRIORITY_LIMIT);
    const excess = data.slice(PRIORITY_LIMIT);

    return res.status(200).json({
      success: true,
      data,
      total,
      priority,
      excess,
      priorityLimit: PRIORITY_LIMIT,
    });
  } catch (error) {
    console.error("Get pendaftaran error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

/*
 * ============================================================================
 * ENDPOINT: PUT /api/pendaftaran/:id
 * ============================================================================
 * Update divisi pendaftar (assign ke divisi yang cocok oleh admin).
 * Body: { assigned_divisi: string }
 * ============================================================================
 */
export const updatePendaftaranDivisi = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_divisi, admin_nama } = req.body;

    if (!assigned_divisi || !DIVISI_VALID.includes(assigned_divisi)) {
      return res.status(400).json({
        success: false,
        message: "Divisi tidak valid",
      });
    }

    const { data, error } = await supabase
      .from("pendaftaran")
      .update({
        assigned_divisi,
        assigned_at: new Date().toISOString(),
        assigned_by: admin_nama || "admin",
        status: "assigned",
      })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal update divisi: " + error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pendaftar tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Divisi pendaftar berhasil diupdate",
      data: data[0],
    });
  } catch (error) {
    console.error("Update divisi error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

/*
 * ============================================================================
 * ENDPOINT: DELETE /api/pendaftaran/:id
 * ============================================================================
 * Hapus pendaftar berdasarkan id (admin only).
 * ============================================================================
 */
export const deletePendaftaran = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data pendaftar dulu untuk hapus file di storage
    const { data: existing, error: fetchError } = await supabase
      .from("pendaftaran")
      .select("cv_url, transkrip_url, surat_persetujuan_url")
      .eq("id", id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data pendaftar: " + fetchError.message,
      });
    }

    // Hapus data dari tabel
    const { error } = await supabase
      .from("pendaftaran")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal menghapus pendaftar: " + error.message,
      });
    }

    // Hapus file dari storage (best effort, jangan gagalkan response)
    if (existing) {
      const urls = [
        existing.cv_url,
        existing.transkrip_url,
        existing.surat_persetujuan_url,
      ].filter(Boolean);

      for (const url of urls) {
        try {
          // Extract path dari URL
          const match = url.match(/\/storage\/v1\/object\/public\/pendaftaran-files\/(.+)$/);
          if (match) {
            const filePath = match[1];
            await supabase.storage
              .from("pendaftaran-files")
              .remove([filePath]);
          }
        } catch (e) {
          console.warn("Gagal hapus file:", e.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Pendaftar berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete pendaftaran error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

/*
 * ============================================================================
 * ENDPOINT: POST /api/admin-pendaftaran/login
 * ============================================================================
 * Login admin untuk dashboard pendaftaran.
 *
 * REQUEST BODY:
 * - username: string
 * - password: string
 * ============================================================================
 */
export const loginAdminPendaftaran = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi",
      });
    }

    const { data, error } = await supabase
      .from("admin_pendaftaran")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    const validPassword = await bcrypt.compare(password, data.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    const token = jwt.sign(
      {
        id: data.id,
        username: data.username,
        nama: data.nama,
        role: "admin_pendaftaran",
      },
      getJWTSecret(),
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: data.id,
        username: data.username,
        nama: data.nama,
        role: "admin_pendaftaran",
      },
    });
  } catch (error) {
    console.error("Login admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};
