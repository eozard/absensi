import { supabase } from "../config/supabase.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function createAdminUser() {
  try {
    console.log("👨‍💼 Membuat admin user...\n");

    const nama = "admin";
    const password = "admin123";

    // Check if admin already exists
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("nama", nama);

    if (checkError) {
      console.error("❌ Error checking admin:", checkError.message);
      return;
    }

    if (existing && existing.length > 0) {
      console.log("⚠️  Admin user sudah ada");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const { data, error } = await supabase
      .from("users")
      .insert({
        nama,
        password: hashedPassword,
        role: "admin",
        kelompok: null,
        devices: [],
        max_devices: 999,
      })
      .select();

    if (error) {
      console.error("❌ Error creating admin:", error.message);
      return;
    }

    console.log("✅ Admin user berhasil dibuat");
    console.log(`\n📝 Login credentials:`);
    console.log(`  Username: ${nama}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

createAdminUser();
