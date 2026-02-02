import { supabase } from "../config/supabase.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function resetAdmin() {
  try {
    console.log("🔄 Reset admin user...\n");

    const nama = "admin";
    const password = "admin123";

    // Delete existing admin
    console.log("🗑️  Menghapus admin lama...");
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("nama", nama);

    if (deleteError) {
      console.error("❌ Error deleting admin:", deleteError.message);
      return;
    }

    console.log("✅ Admin lama dihapus");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    console.log("➕ Membuat admin baru...");
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

    console.log("\n✅ Admin berhasil dibuat!");
    console.log(`\n📝 Login credentials:`);
    console.log(`   Username: ${nama}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🌐 Silakan login di: http://localhost:5173`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

resetAdmin();
