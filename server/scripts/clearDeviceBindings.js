import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function clearDeviceBindings() {
  try {
    console.log("🧹 Clearing all device bindings...");

    const { data, error } = await supabase
      .from("device_bindings")
      .delete()
      .neq("id", 0); // Delete all records

    if (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }

    console.log("✅ All device bindings cleared!");
    console.log("You can now login fresh from any device.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

clearDeviceBindings();
