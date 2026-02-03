import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Lazy load JWT_SECRET to ensure dotenv is loaded first
const getJWTSecret = () => {
  return (
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-min-32-characters-long-here"
  );
};

// POST /api/login
export const login = async (req, res) => {
  try {
    const { nama, password, deviceId } = req.body;

    console.log("\n" + "=".repeat(60));
    console.log("🔐 NEW LOGIN REQUEST");
    console.log("=".repeat(60));
    console.log("👤 User:", nama);
    console.log("📱 Device ID:", deviceId);
    console.log("⏰ Timestamp:", new Date().toISOString());
    console.log("=".repeat(60) + "\n");

    if (!nama || !password || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Nama, password, dan deviceId diperlukan",
      });
    }

    // Deteksi IP client - Fitur ini dinonaktifkan
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";

    console.log(
      `🔐 Login attempt: ${nama} dari device: ${deviceId}, IP: ${clientIp}`,
    );

    // Get user dari database
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("nama", nama);

    if (fetchError) {
      console.error("Database error:", fetchError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Nama atau password salah",
      });
    }

    const user = users[0];

    // Device binding check PERTAMA (sebelum password check) - skip untuk admin
    if (user.role !== "admin") {
      // Check apakah device ini sudah terdaftar ke user lain
      const { data: deviceBindings, error: deviceError } = await supabase
        .from("device_bindings")
        .select("*")
        .eq("device_id", deviceId);

      if (deviceError) {
        console.error("Device binding error:", deviceError.message);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (deviceBindings && deviceBindings.length > 0) {
        const boundUser = deviceBindings[0];
        if (boundUser.user_name !== nama) {
          console.log(
            `❌ Device ${deviceId} sudah terdaftar ke user ${boundUser.user_name}`,
          );
          return res.status(403).json({
            success: false,
            message: `Device sudah terikat untuk user lain (${boundUser.user_name})`,
          });
        }
      }
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Nama atau password salah",
      });
    }

    // Device binding untuk non-admin
    if (user.role !== "admin") {
      const existingDevices = user.devices || [];

      // Check apakah device ini sudah di list devices user
      const deviceExists = existingDevices.some((d) => d.deviceId === deviceId);

      if (!deviceExists) {
        // Device baru
        if (existingDevices.length >= user.max_devices) {
          console.log(
            `❌ User ${nama} sudah mencapai maksimal devices (${user.max_devices})`,
          );
          return res.status(403).json({
            success: false,
            message: `Maksimal ${user.max_devices} device per user`,
          });
        }

        // Add device
        existingDevices.push({
          deviceId,
          firstSeen: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 1,
        });

        // Update user devices
        const { error: updateError } = await supabase
          .from("users")
          .update({ devices: existingDevices })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating devices:", updateError.message);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        // Add device binding
        console.log("🔍 About to insert device binding:", {
          device_id: deviceId,
          user_name: nama,
          kelompok: user.kelompok,
        });

        const { data: bindData, error: bindError } = await supabase
          .from("device_bindings")
          .insert({
            device_id: deviceId,
            user_name: nama,
            kelompok: user.kelompok,
            bound_at: new Date().toISOString(),
            last_used: new Date().toISOString(),
            usage_count: 1,
          })
          .select();

        if (bindError) {
          console.error(
            "❌ Error binding device - FULL DETAILS:",
            JSON.stringify(
              {
                message: bindError.message,
                code: bindError.code,
                details: bindError.details,
                hint: bindError.hint,
              },
              null,
              2,
            ),
          );
          // Hanya return error kalau bukan duplicate key (23505)
          if (bindError.code !== "23505") {
            return res.status(500).json({
              success: false,
              message: "Database error: " + bindError.message,
            });
          }
          console.log(`⚠️  Device sudah ada di device_bindings (diabaikan)`);
        } else {
          console.log(`✅ Device baru terbind untuk user ${nama}:`, bindData);
        }
      } else {
        // Update existing device
        const deviceIndex = existingDevices.findIndex(
          (d) => d.deviceId === deviceId,
        );
        existingDevices[deviceIndex].lastUsed = new Date().toISOString();
        existingDevices[deviceIndex].usageCount =
          (existingDevices[deviceIndex].usageCount || 0) + 1;

        const { error: updateError } = await supabase
          .from("users")
          .update({ devices: existingDevices })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating device usage:", updateError.message);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        // UPSERT device binding (insert jika belum ada, update jika sudah ada)
        console.log("🔄 Upserting device binding for existing device");
        const { data: upsertData, error: bindUpsertError } = await supabase
          .from("device_bindings")
          .upsert(
            {
              device_id: deviceId,
              user_name: nama,
              kelompok: user.kelompok,
              last_used: new Date().toISOString(),
              usage_count: existingDevices[deviceIndex].usageCount,
            },
            {
              onConflict: "device_id",
            },
          )
          .select();

        if (bindUpsertError) {
          console.error(
            "❌ Error upserting device binding:",
            bindUpsertError.message,
          );
        } else {
          console.log(
            `✅ Device binding upserted untuk user ${nama}:`,
            upsertData,
          );
        }

        console.log(
          `✅ Device update untuk user ${nama}: usage count = ${existingDevices[deviceIndex].usageCount}`,
        );
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        nama: user.nama,
        role: user.role,
        kelompok: user.kelompok,
        deviceId,
      },
      getJWTSecret(),
      { expiresIn: "24h" },
    );

    console.log(`✅ Login berhasil: ${nama} (${user.role})`);

    return res.json({
      success: true,
      token,
      user: {
        nama: user.nama,
        role: user.role,
        kelompok: user.kelompok,
        devicesCount: (user.devices || []).length,
        maxDevices: user.max_devices,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/absen
export const absen = async (req, res) => {
  try {
    const { login_time, deviceId } = req.body;
    const { nama, role, kelompok } = req.user;

    if (!login_time || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "login_time dan deviceId diperlukan",
      });
    }

    console.log(`📝 Absen attempt: ${nama} di ${login_time}`);

    // Validate device
    const { data: deviceBindings, error: deviceError } = await supabase
      .from("device_bindings")
      .select("*")
      .eq("device_id", deviceId);

    if (deviceError || !deviceBindings || deviceBindings.length === 0) {
      console.log(`❌ Device ${deviceId} tidak terdaftar`);
      return res.status(403).json({
        success: false,
        message: "Device tidak terdaftar",
      });
    }

    // Parse login time
    const loginDateTime = new Date(login_time);
    const hour = loginDateTime.getHours();
    const minute = loginDateTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Determine sesi
    let sesi;
    const pagiStart = 8 * 60; // 08:00
    const pagiEnd = 14 * 60 + 40; // 14:40
    const soreStart = 15 * 60; // 15:00
    const soreEnd = 18 * 60; // 18:00

    if (timeInMinutes >= pagiStart && timeInMinutes <= pagiEnd) {
      sesi = "pagi";
    } else if (timeInMinutes >= soreStart && timeInMinutes <= soreEnd) {
      sesi = "sore";
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Waktu absensi tidak valid. Pagi: 08:00-14:40, Sore: 15:00-18:00",
      });
    }

    // Check untuk sore session - harus sudah absen pagi + jeda 6 jam
    if (sesi === "sore") {
      const today = loginDateTime.toISOString().split("T")[0];
      const { data: pagiAttendance, error: pagiError } = await supabase
        .from("attendances")
        .select("*")
        .eq("nama", nama)
        .eq("tanggal", today)
        .eq("sesi", "pagi");

      if (pagiError) {
        console.error("Pagi attendance check error:", pagiError.message);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (!pagiAttendance || pagiAttendance.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Harus sudah absen pagi sebelum absen sore",
        });
      }

      // Check jeda 6 jam
      const pagiLoginTime = new Date(pagiAttendance[0].login_time);
      const diffHours = (loginDateTime - pagiLoginTime) / (1000 * 60 * 60);

      if (diffHours < 6) {
        return res.status(403).json({
          success: false,
          message: `Jeda absen pagi-sore minimal 6 jam. Waktu tersisa: ${(6 - diffHours).toFixed(1)} jam`,
        });
      }
    }

    // Check duplikat absen
    const today = loginDateTime.toISOString().split("T")[0];
    const { data: existingAttendance, error: existingError } = await supabase
      .from("attendances")
      .select("*")
      .eq("nama", nama)
      .eq("tanggal", today)
      .eq("sesi", sesi);

    if (existingError) {
      console.error("Duplicate check error:", existingError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (existingAttendance && existingAttendance.length > 0) {
      console.log(`❌ Duplikat absen ${sesi} untuk ${nama}`);
      return res.status(403).json({
        success: false,
        message: `Anda sudah absen ${sesi} hari ini`,
      });
    }

    // Create attendance record
    const jamMasuk = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

    const { data: newAttendance, error: insertError } = await supabase
      .from("attendances")
      .insert({
        nama,
        kelompok,
        tanggal: today,
        sesi,
        jam_masuk: jamMasuk,
        login_time: loginDateTime.toISOString(),
        status: "hadir",
      })
      .select();

    if (insertError) {
      console.error("Insert attendance error:", insertError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    console.log(`✅ Absen berhasil: ${nama} - ${sesi} - ${jamMasuk}`);

    return res.json({
      success: true,
      message: `Absen ${sesi} berhasil tercatat`,
      attendance: newAttendance[0],
    });
  } catch (error) {
    console.error("Absen error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/izin - Get izin mahasiswa
export const getIzin = async (req, res) => {
  try {
    const { nama } = req.user;

    const { data: izinList, error } = await supabase
      .from("izin")
      .select("*")
      .eq("nama", nama)
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

// DELETE /api/izin/:id - Batalkan izin (hanya pending)
export const cancelIzin = async (req, res) => {
  try {
    const { nama } = req.user;
    const { id } = req.params;

    // Check if izin exists and belongs to user
    const { data: izinData, error: fetchError } = await supabase
      .from("izin")
      .select("*")
      .eq("id", id)
      .eq("nama", nama)
      .single();

    if (fetchError || !izinData) {
      return res.status(404).json({
        success: false,
        message: "Izin tidak ditemukan",
      });
    }

    if (izinData.status !== "pending") {
      return res.status(403).json({
        success: false,
        message: "Hanya izin pending yang bisa dibatalkan",
      });
    }

    // Delete izin
    const { error: deleteError } = await supabase
      .from("izin")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete izin error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    console.log(`✅ Izin ${id} dibatalkan oleh ${nama}`);

    return res.json({
      success: true,
      message: "Izin berhasil dibatalkan",
    });
  } catch (error) {
    console.error("Cancel izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/izin
export const submitIzin = async (req, res) => {
  try {
    const { nama, kelompok } = req.user;
    const { keterangan } = req.body;

    if (!keterangan) {
      return res.status(400).json({
        success: false,
        message: "Keterangan izin diperlukan",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    console.log(`📝 Submit izin: ${nama} untuk hari ini (${today})`);

    // Insert izin
    const { data, error } = await supabase
      .from("izin")
      .insert({
        nama,
        kelompok,
        tanggal: today,
        keterangan,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("Submit izin error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    console.log(`✅ Izin berhasil disubmit untuk ${nama}`);

    return res.json({
      success: true,
      message: "Izin berhasil diajukan",
      data: data[0],
    });
  } catch (error) {
    console.error("Submit izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/riwayat
export const getRiwayat = async (req, res) => {
  try {
    const { nama } = req.user;

    console.log(`📖 Get riwayat untuk: ${nama}`);

    const { data: attendances, error } = await supabase
      .from("attendances")
      .select("*")
      .eq("nama", nama)
      .order("tanggal", { ascending: false });

    if (error) {
      console.error("Get riwayat error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    return res.json({
      success: true,
      data: attendances || [],
    });
  } catch (error) {
    console.error("Get riwayat error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default router;
