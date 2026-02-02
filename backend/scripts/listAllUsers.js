import { supabase } from "../config/supabase.js";
import dotenv from "dotenv";

dotenv.config();

async function listAllUsers() {
  try {
    console.log("👥 Daftar semua users:\n");

    const { data: users, error } = await supabase
      .from("users")
      .select("nama, role, kelompok, devices")
      .order("nama", { ascending: true });

    if (error) {
      console.error("❌ Error fetching users:", error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log("❌ Tidak ada users");
      return;
    }

    console.table(
      users.map((u) => ({
        Nama: u.nama,
        Role: u.role,
        Kelompok: u.kelompok || "-",
        Devices: u.devices ? u.devices.length : 0,
      })),
    );

    console.log(`\nTotal: ${users.length} users`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listAllUsers();
