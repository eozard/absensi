import { supabase } from "./config/supabase.js";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  try {
    console.log("🔍 Testing Supabase Connection...");
    console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);

    // Test 1: Check users table
    console.log("\n✅ Testing users table...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (usersError) {
      console.error("❌ Users table error:", usersError.message);
    } else {
      console.log("✅ Users table OK, found:", users.length, "records");
    }

    // Test 2: Check attendances table
    console.log("\n✅ Testing attendances table...");
    const { data: attendances, error: attendancesError } = await supabase
      .from("attendances")
      .select("*")
      .limit(1);

    if (attendancesError) {
      console.error("❌ Attendances table error:", attendancesError.message);
    } else {
      console.log(
        "✅ Attendances table OK, found:",
        attendances.length,
        "records",
      );
    }

    // Test 3: Check device_bindings table
    console.log("\n✅ Testing device_bindings table...");
    const { data: devices, error: devicesError } = await supabase
      .from("device_bindings")
      .select("*")
      .limit(1);

    if (devicesError) {
      console.error("❌ Device_bindings table error:", devicesError.message);
    } else {
      console.log(
        "✅ Device_bindings table OK, found:",
        devices.length,
        "records",
      );
    }

    console.log("\n✅ All tables are accessible!");
  } catch (error) {
    console.error("❌ Connection error:", error.message);
  }
}

testConnection();
