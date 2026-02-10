import express from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    console.log("📊 Get admin stats");

    // Total mahasiswa
    const { data: mahasiswa, error: mahasiswaError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "mahasiswa");

    // Total anak SMK
    const { data: anakSmk, error: anakSmkError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "anak_smk");

    // Hadir hari ini
    const today = new Date().toISOString().split("T")[0];
    const { data: hadirToday, error: hadirError } = await supabase
      .from("attendances")
      .select("id")
      .eq("tanggal", today)
      .eq("status", "hadir");

    // Alpa hari ini
    const { data: alpaToday, error: alpaError } = await supabase
      .from("attendances")
      .select("id")
      .eq("tanggal", today)
      .eq("status", "alpa");

    if (mahasiswaError || anakSmkError || hadirError || alpaError) {
      console.error("Stats error");
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      stats: {
        totalMahasiswa: mahasiswa?.length || 0,
        totalAnakSmk: anakSmk?.length || 0,
        hadirToday: hadirToday?.length || 0,
        alpaToday: alpaToday?.length || 0,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/attendance-today
export const getAttendanceToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    console.log(`📋 Get attendance untuk: ${today}`);

    const { data: attendances, error } = await supabase
      .from("attendances")
      .select("*")
      .eq("tanggal", today)
      .order("nama", { ascending: true });

    if (error) {
      console.error("Get attendance error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    // Transform data ke format yang lebih user-friendly
    const result = {};
    (attendances || []).forEach((att) => {
      if (!result[att.nama]) {
        result[att.nama] = {
          nama: att.nama,
          kelompok: att.kelompok,
          pagi: null,
          sore: null,
        };
      }
      if (att.sesi === "pagi") {
        result[att.nama].pagi = {
          jam_masuk: att.jam_masuk,
          status: att.status,
        };
      } else if (att.sesi === "sore") {
        result[att.nama].sore = {
          jam_masuk: att.jam_masuk,
          status: att.status,
        };
      }
    });

    return res.json({
      success: true,
      data: Object.values(result),
    });
  } catch (error) {
    console.error("Get attendance today error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/students
export const getStudents = async (req, res) => {
  try {
    console.log("� Get all students");

    const { data: students, error } = await supabase
      .from("users")
      .select("nama, role, kelompok")
      .in("role", ["mahasiswa", "anak_smk"])
      .order("nama", { ascending: true });

    if (error) {
      console.error("Get students error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      students: students || [],
    });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/attendance/:nama
export const getStudentAttendance = async (req, res) => {
  try {
    const { nama } = req.params;

    console.log(`📖 Get attendance untuk: ${nama}`);

    const { data: attendances, error } = await supabase
      .from("attendances")
      .select("*")
      .eq("nama", nama)
      .order("tanggal", { ascending: false });

    if (error) {
      console.error("Get student attendance error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    // Calculate summary
    let totalPagi = 0,
      totalSore = 0,
      totalAlpa = 0;
    (attendances || []).forEach((att) => {
      if (att.status === "hadir") {
        if (att.sesi === "pagi") totalPagi++;
        else if (att.sesi === "sore") totalSore++;
      } else if (att.status === "alpa") {
        totalAlpa++;
      }
    });

    return res.json({
      success: true,
      data: attendances || [],
      summary: { totalPagi, totalSore, totalAlpa },
    });
  } catch (error) {
    console.error("Get student attendance error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/devices
export const getDevices = async (req, res) => {
  try {
    console.log("📱 Get all devices");

    const { data: devices, error } = await supabase
      .from("device_bindings")
      .select("device_id, user_name, kelompok, last_used")
      .order("last_used", { ascending: false });

    if (error) {
      console.error("Get devices error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      devices: devices || [],
    });
  } catch (error) {
    console.error("Get devices error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/admin/devices/:deviceId
export const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    console.log(`🗑️ Delete device: ${deviceId}`);

    const { error } = await supabase
      .from("device_bindings")
      .delete()
      .eq("device_id", deviceId);

    if (error) {
      console.error("Delete device error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      message: "Device berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete device error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    console.log("👥 Get all users");

    const { data: users, error } = await supabase
      .from("users")
      .select("id, nama, role, kelompok, devices")
      .order("nama", { ascending: true });

    if (error) {
      console.error("Get users error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    // Transform to add devices_count
    const formattedUsers = (users || []).map((user) => ({
      ...user,
      devices_count: user.devices ? user.devices.length : 0,
    }));

    return res.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/admin/users/:id/reset-devices
export const resetUserDevices = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User id diperlukan" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, nama")
      .eq("id", id)
      .single();

    if (userError || !user) {
      console.error("Get user error:", userError?.message);
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const { error: deleteError } = await supabase
      .from("device_bindings")
      .delete()
      .eq("user_name", user.nama);

    if (deleteError) {
      console.error("Delete device bindings error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ devices: [] })
      .eq("id", id);

    if (updateError) {
      console.error("Reset devices error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      message: "Device user berhasil direset",
    });
  } catch (error) {
    console.error("Reset devices error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/admin/users
export const createUser = async (req, res) => {
  try {
    const { nama, password, role, kelompok } = req.body;

    if (!nama || !password || !role || !kelompok) {
      return res.status(400).json({
        success: false,
        message: "Nama, password, role, dan kelompok diperlukan",
      });
    }

    console.log(`➕ Create user: ${nama} (${role})`);

    // Check jika user sudah ada
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("nama", nama);

    if (checkError) {
      console.error("Check user error:", checkError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (existingUser && existingUser.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User sudah ada" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          nama,
          password: hashedPassword,
          role,
          kelompok,
          devices: [],
          max_devices: role === "admin" ? 999 : 2,
        },
      ])
      .select();

    if (createError) {
      console.error("Create user error:", createError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    console.log(`✅ User ${nama} berhasil dibuat`);

    return res.json({
      success: true,
      message: "User berhasil dibuat",
      user: newUser?.[0],
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/report - filtered attendance report
export const getAttendanceReport = async (req, res) => {
  try {
    const { fromDate, toDate, kelompok } = req.query;

    console.log(
      `📊 Get report: ${fromDate} to ${toDate}, kelompok: ${kelompok}`,
    );

    let query = supabase
      .from("attendances")
      .select("*")
      .order("tanggal", { ascending: false })
      .order("jam_masuk", { ascending: false });

    // Apply date filter
    if (fromDate) {
      query = query.gte("tanggal", fromDate);
    }
    if (toDate) {
      query = query.lte("tanggal", toDate);
    }

    // Apply kelompok filter
    if (kelompok && kelompok !== "all") {
      query = query.eq("kelompok", kelompok);
    }

    const { data: attendances, error } = await query;

    if (error) {
      console.error("Get report error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      data: attendances || [],
      count: attendances?.length || 0,
    });
  } catch (error) {
    console.error("Get report error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/izin - Get all izin requests
export const getAllIzin = async (req, res) => {
  try {
    console.log("📋 Get all izin requests");

    const { data: izinList, error } = await supabase
      .from("izin")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get izin error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      data: izinList || [],
    });
  } catch (error) {
    console.error("Get izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/admin/izin/:id - Approve/Reject izin
export const updateIzinStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const adminName = req.user.nama;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status harus 'approved' atau 'rejected'",
      });
    }

    console.log(`✏️ Update izin ${id} to ${status} by ${adminName}`);

    const { data, error } = await supabase
      .from("izin")
      .update({
        status,
        approved_by: adminName,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Update izin error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Izin tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      message: `Izin berhasil ${status === "approved" ? "disetujui" : "ditolak"}`,
      data: data[0],
    });
  } catch (error) {
    console.error("Update izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default router;
