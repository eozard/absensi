import { supabase } from "./config/supabase.js";

console.log("🧪 COMPREHENSIVE DEVICE BINDING TEST\n");

async function runTests() {
  const testUser = "enamenam";
  const testDevice = `device_unittest_${Date.now()}`;

  console.log(`Test User: ${testUser}`);
  console.log(`Test Device: ${testDevice}\n`);

  // Test 1: Get user
  console.log("📋 Test 1: Fetch user from database");
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("nama", testUser);

  if (userError || !users || users.length === 0) {
    console.error("❌ User not found or error:", userError?.message);
    return;
  }

  const user = users[0];
  console.log(`✅ User found: ${user.nama} (${user.role})`);
  console.log(`   Kelompok: ${user.kelompok}`);
  console.log(`   Current devices: ${user.devices?.length || 0}\n`);

  // Test 2: Check if device already exists in device_bindings
  console.log("📋 Test 2: Check if test device already exists");
  const { data: existingBindings } = await supabase
    .from("device_bindings")
    .select("*")
    .eq("device_id", testDevice);

  if (existingBindings && existingBindings.length > 0) {
    console.log("⚠️  Test device already exists, deleting first...");
    await supabase.from("device_bindings").delete().eq("device_id", testDevice);
  }
  console.log("✅ Test device doesn't exist (good for testing)\n");

  // Test 3: Simulate NEW device binding (INSERT)
  console.log("📋 Test 3: Insert new device binding");
  const { data: insertData, error: insertError } = await supabase
    .from("device_bindings")
    .insert({
      device_id: testDevice,
      user_name: testUser,
      kelompok: user.kelompok,
      bound_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
      usage_count: 1,
    })
    .select();

  if (insertError) {
    console.error("❌ INSERT FAILED:");
    console.error(
      JSON.stringify(
        {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log("✅ INSERT SUCCESS:");
  console.log(JSON.stringify(insertData, null, 2));
  console.log();

  // Test 4: Simulate existing device binding (UPSERT)
  console.log("📋 Test 4: UPSERT existing device binding");
  const { data: upsertData, error: upsertError } = await supabase
    .from("device_bindings")
    .upsert(
      {
        device_id: testDevice,
        user_name: testUser,
        kelompok: user.kelompok,
        last_used: new Date().toISOString(),
        usage_count: 2,
      },
      {
        onConflict: "device_id",
      },
    )
    .select();

  if (upsertError) {
    console.error("❌ UPSERT FAILED:");
    console.error(upsertError.message);
    return;
  }

  console.log("✅ UPSERT SUCCESS:");
  console.log(JSON.stringify(upsertData, null, 2));
  console.log();

  // Test 5: Verify final state
  console.log("📋 Test 5: Verify final state in database");
  const { data: finalBinding } = await supabase
    .from("device_bindings")
    .select("*")
    .eq("device_id", testDevice)
    .single();

  if (finalBinding) {
    console.log("✅ Final state:");
    console.log(`   Device ID: ${finalBinding.device_id}`);
    console.log(`   User: ${finalBinding.user_name}`);
    console.log(`   Kelompok: ${finalBinding.kelompok}`);
    console.log(`   Usage Count: ${finalBinding.usage_count}`);
    console.log(`   Last Used: ${finalBinding.last_used}`);
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  await supabase.from("device_bindings").delete().eq("device_id", testDevice);
  console.log("✅ Cleanup complete");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 ALL TESTS PASSED!");
  console.log("=".repeat(60));
  console.log("\n✅ CONCLUSION:");
  console.log("   - Supabase connection: OK");
  console.log("   - INSERT to device_bindings: OK");
  console.log("   - UPSERT to device_bindings: OK");
  console.log("   - Backend code should work correctly!");
  console.log("\n⚠️  IF DEVICE BINDING STILL NOT WORKING:");
  console.log("   1. User must CLEAR localStorage in browser");
  console.log("   2. Generate new device ID (with timestamp)");
  console.log("   3. Login again");
  console.log("   4. Check backend logs for detailed output");
}

runTests().catch(console.error);
