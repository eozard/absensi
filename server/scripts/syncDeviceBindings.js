import { supabase } from "../config/supabase.js";

console.log("🔄 Syncing user.devices to device_bindings table...\n");

async function syncDeviceBindings() {
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*");

  if (usersError) {
    console.error("Error fetching users:", usersError.message);
    return;
  }

  console.log(`Found ${users.length} users\n`);

  for (const user of users) {
    if (user.role === "admin") {
      console.log(`⏭️  Skipping admin user: ${user.nama}`);
      continue;
    }

    const devices = user.devices || [];
    if (devices.length === 0) {
      console.log(`⏭️  User ${user.nama} has no devices`);
      continue;
    }

    console.log(`\n👤 Processing user: ${user.nama}`);
    console.log(`   Devices in user.devices: ${devices.length}`);

    for (const device of devices) {
      const deviceId = device.deviceId;

      // Check if device already exists in device_bindings
      const { data: existing, error: checkError } = await supabase
        .from("device_bindings")
        .select("*")
        .eq("device_id", deviceId);

      if (checkError) {
        console.error(
          `   ❌ Error checking device ${deviceId}:`,
          checkError.message,
        );
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`   ✓ Device ${deviceId} already in device_bindings`);
      } else {
        // Insert into device_bindings
        console.log(`   📝 Inserting device ${deviceId} to device_bindings...`);

        const { data: insertData, error: insertError } = await supabase
          .from("device_bindings")
          .insert({
            device_id: deviceId,
            user_name: user.nama,
            kelompok: user.kelompok,
            bound_at: device.firstSeen || new Date().toISOString(),
            last_used: device.lastUsed || new Date().toISOString(),
            usage_count: device.usageCount || 1,
          })
          .select();

        if (insertError) {
          console.error(`   ❌ Error inserting:`, insertError.message);
        } else {
          console.log(`   ✅ Successfully inserted:`, insertData[0]);
        }
      }
    }
  }

  // Final check
  console.log("\n\n📊 Final Summary:");
  const { data: allBindings, error: summaryError } = await supabase
    .from("device_bindings")
    .select("*");

  if (summaryError) {
    console.error("Error getting summary:", summaryError.message);
  } else {
    console.log(`Total device_bindings rows: ${allBindings.length}`);
    allBindings.forEach((binding) => {
      console.log(
        `  - ${binding.device_id} → ${binding.user_name} (${binding.kelompok})`,
      );
    });
  }

  console.log("\n✅ Sync complete!");
}

syncDeviceBindings().catch(console.error);
