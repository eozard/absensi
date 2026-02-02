import { supabase } from "../config/supabase.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

// Sample data
const firstNames = [
  "Adi",
  "Ahmad",
  "Budi",
  "Chandra",
  "Dina",
  "Eka",
  "Farah",
  "Gita",
  "Hendra",
  "Indra",
  "Joko",
  "Kirana",
  "Lina",
  "Mochamad",
  "Nisa",
  "Ongki",
  "Putri",
  "Qori",
  "Risa",
  "Siti",
  "Toni",
  "Udin",
  "Vina",
  "Wahyu",
  "Xenia",
  "Yanti",
  "Zainab",
];

const lastNames = [
  "Wijaya",
  "Susanto",
  "Rahman",
  "Setiawan",
  "Handoko",
  "Purnomo",
  "Kusuma",
  "Santoso",
  "Hermawan",
  "Nugroho",
  "Suryanto",
  "Utomo",
];

const kelompoks = [
  "machine learning",
  "software engineering",
  "jaringan",
  "desain komunikasi visual",
];

function generateRandomUsers(count) {
  const users = [];
  const usedNames = new Set(["admin"]);

  for (let i = 0; i < count; i++) {
    let nama;
    let attempts = 0;
    do {
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      nama = `${firstName} ${lastName} (${i + 1})`;
      attempts++;
    } while (usedNames.has(nama) && attempts < 10);

    usedNames.add(nama);

    const role = i < 20 ? "mahasiswa" : "anak_smk";
    const kelompok = kelompoks[Math.floor(Math.random() * kelompoks.length)];

    users.push({
      nama,
      password: "12345678",
      role,
      kelompok,
      devices: [],
      max_devices: 2,
    });
  }

  return users;
}

function generateDummyAttendances(students) {
  const attendances = [];
  const statuses = [
    "hadir",
    "hadir",
    "hadir",
    "hadir",
    "izin_approved",
    "alpa",
  ];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split("T")[0];

    students.forEach((student) => {
      const sesi = Math.random() > 0.5 ? "pagi" : "sore";
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      let hour, minute;
      if (sesi === "pagi") {
        hour = 8 + Math.floor(Math.random() * 4);
        minute = Math.floor(Math.random() * 60);
      } else {
        hour = 12 + Math.floor(Math.random() * 6);
        minute = Math.floor(Math.random() * 60);
      }

      const jamMasuk = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      const loginTime = new Date(date);
      loginTime.setHours(hour, minute, 0);

      attendances.push({
        nama: student.nama,
        kelompok: student.kelompok,
        tanggal: dateStr,
        sesi,
        jam_masuk: jamMasuk,
        login_time: loginTime.toISOString(),
        status,
      });
    });
  }

  return attendances;
}

async function seedDatabase() {
  try {
    console.log("🌱 Mulai seeding database...\n");

    // 1. Create admin user
    console.log("👨‍💼 Membuat admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);

    const { data: existingAdmin, error: checkAdminError } = await supabase
      .from("users")
      .select("id")
      .eq("nama", "admin");

    if (checkAdminError) {
      console.error("❌ Error checking admin:", checkAdminError.message);
      return;
    }

    if (existingAdmin && existingAdmin.length === 0) {
      const { error: adminError } = await supabase.from("users").insert({
        nama: "admin",
        password: adminPassword,
        role: "admin",
        kelompok: null,
        devices: [],
        max_devices: 999,
      });

      if (adminError) {
        console.error("❌ Error creating admin:", adminError.message);
        return;
      }
      console.log("✅ Admin user berhasil dibuat (admin/admin123)\n");
    } else {
      console.log("⚠️  Admin user sudah ada\n");
    }

    // 2. Create 40 students
    console.log("👥 Membuat 40 mahasiswa/anak SMK...");
    const students = generateRandomUsers(40);

    for (const student of students) {
      const hashedPassword = await bcrypt.hash(student.password, 10);

      const { data: existing, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("nama", student.nama);

      if (checkError) {
        console.error(`❌ Error checking ${student.nama}:`, checkError.message);
        continue;
      }

      if (existing && existing.length === 0) {
        const { error: insertError } = await supabase.from("users").insert({
          nama: student.nama,
          password: hashedPassword,
          role: student.role,
          kelompok: student.kelompok,
          devices: [],
          max_devices: 2,
        });

        if (insertError) {
          console.error(
            `❌ Error creating ${student.nama}:`,
            insertError.message,
          );
        }
      }
    }

    // Get all students for attendance seeding
    const { data: allStudents, error: fetchStudentsError } = await supabase
      .from("users")
      .select("*")
      .in("role", ["mahasiswa", "anak_smk"]);

    if (fetchStudentsError) {
      console.error("❌ Error fetching students:", fetchStudentsError.message);
      return;
    }

    console.log(`✅ ${allStudents.length} student berhasil dibuat/ada\n`);

    // 3. Create dummy attendances
    console.log("📋 Membuat 30 hari data absensi...");
    const attendances = generateDummyAttendances(allStudents);

    // Batch insert (Supabase limit ~ 1000 per request)
    const batchSize = 500;
    for (let i = 0; i < attendances.length; i += batchSize) {
      const batch = attendances.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from("attendances")
        .insert(batch);

      if (insertError) {
        // Ignore duplicate key errors
        if (!insertError.message.includes("duplicate")) {
          console.error(
            `❌ Error inserting attendance batch ${i / batchSize + 1}:`,
            insertError.message,
          );
        }
      }
    }

    console.log(
      `✅ ${attendances.length} attendance records berhasil dibuat/ada\n`,
    );

    console.log("✅ Seeding selesai!\n");
    console.log("📊 Summary:");
    console.log(`  - Admin: 1 (admin/admin123)`);
    console.log(`  - Mahasiswa: 20 (password: 12345678)`);
    console.log(`  - Anak SMK: 20 (password: 12345678)`);
    console.log(`  - Attendance records: ${attendances.length}`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
}

seedDatabase();
