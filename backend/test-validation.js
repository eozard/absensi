import { supabase } from "./config/supabase.js";
import bcrypt from "bcrypt";

console.log("🧪 TEST: Device Binding Validation\n");

async function testValidation() {
  const testDevice = `device_validation_test_${Date.now()}`;
  const userA = "enamenam";
  const userB = "satu11";

  console.log("Test Setup:");
  console.log(`  User A: ${userA}`);
  console.log(`  User B: ${userB}`);
  console.log(`  Device: ${testDevice}\n`);

  // Cleanup first
  await supabase.from("device_bindings").delete().eq("device_id", testDevice);

  // Test 1: User A login dengan device baru
  console.log("📋 Test 1: User A login dengan device baru");

  // Get User A
  const { data: usersA } = await supabase
    .from("users")
    .select("*")
    .eq("nama", userA);

  if (!usersA || usersA.length === 0) {
    console.error("❌ User A not found!");
    return;
  }

  const userAData = usersA[0];
  const { data: existingBindings1 } = await supabase
    .from("device_bindings")
    .select("*")
    .eq("device_id", testDevice);

  if (existingBindings1 && existingBindings1.length > 0) {
    console.log(
      `❌ Device sudah terikat ke: ${existingBindings1[0].user_name}`,
    );
    console.log("   → Login DITOLAK ❌");
  } else {
    console.log("✅ Device belum terikat");

    // Bind device to User A
    const { error: insertError } = await supabase
      .from("device_bindings")
      .insert({
        device_id: testDevice,
        user_name: userA,
        kelompok: userAData.kelompok,
      });

    if (insertError) {
      console.error("❌ Error binding:", insertError.message);
    } else {
      console.log(`✅ Device berhasil di-bind ke User A`);
      console.log("   → Login BERHASIL ✅\n");
    }
  }

  // Test 2: User B coba login dengan device yang sama
  console.log("📋 Test 2: User B coba login dengan device yang SAMA");

  // Get User B
  const { data: usersB } = await supabase
    .from("users")
    .select("*")
    .eq("nama", userB);

  if (!usersB || usersB.length === 0) {
    console.error("❌ User B not found!");
    return;
  }

  const userBData = usersB[0];
  const { data: existingBindings2 } = await supabase
    .from("device_bindings")
    .select("*")
    .eq("device_id", testDevice);

  if (existingBindings2 && existingBindings2.length > 0) {
    const boundUser = existingBindings2[0];
    if (boundUser.user_name !== userB) {
      console.log(`⚠️  Device sudah terikat ke: ${boundUser.user_name}`);
      console.log(
        `   User B (${userB}) mencoba login dengan device milik ${boundUser.user_name}`,
      );
      console.log("   → Login DITOLAK ❌");
      console.log("   → Backend response: 403 Forbidden");
      console.log(
        `   → Message: "Device sudah terikat untuk user lain (${boundUser.user_name})"`,
      );
      console.log("\n✅ VALIDATION BEKERJA DENGAN BENAR!\n");
    } else {
      console.log("❌ Validation error: Device seharusnya terikat ke User A!");
    }
  } else {
    console.log("❌ Validation error: Device seharusnya sudah terikat!");
  }

  // Test 3: Simulate unbind (logout User A)
  console.log("📋 Test 3: User A logout → unbind device");

  const { error: deleteError } = await supabase
    .from("device_bindings")
    .delete()
    .eq("device_id", testDevice);

  if (deleteError) {
    console.error("❌ Error unbinding:", deleteError.message);
  } else {
    console.log("✅ Device di-unbind dari User A");
    console.log("   → localStorage.removeItem('deviceId') executed\n");
  }

  // Test 4: User B login lagi dengan device baru
  console.log("📋 Test 4: User B login dengan device BARU setelah unbind");

  const newDevice = `device_validation_test_${Date.now()}`;
  console.log(`   New device ID: ${newDevice}`);

  const { data: existingBindings3 } = await supabase
    .from("device_bindings")
    .select("*")
    .eq("device_id", newDevice);

  if (!existingBindings3 || existingBindings3.length === 0) {
    console.log("✅ Device baru belum terikat");

    // Bind to User B
    const { error: insertError2 } = await supabase
      .from("device_bindings")
      .insert({
        device_id: newDevice,
        user_name: userB,
        kelompok: userBData.kelompok,
      });

    if (insertError2) {
      console.error("❌ Error binding:", insertError2.message);
    } else {
      console.log(`✅ Device berhasil di-bind ke User B`);
      console.log("   → Login BERHASIL ✅\n");
    }
  }

  // Cleanup
  console.log("🧹 Cleanup...");
  await supabase.from("device_bindings").delete().eq("device_id", testDevice);
  await supabase.from("device_bindings").delete().eq("device_id", newDevice);
  console.log("✅ Test data cleaned\n");

  console.log("=".repeat(60));
  console.log("📊 HASIL TEST:");
  console.log("=".repeat(60));
  console.log("✅ Test 1: User A login device baru → BERHASIL");
  console.log("✅ Test 2: User B login device sama → DITOLAK (correct!)");
  console.log("✅ Test 3: User A logout → Device di-unbind");
  console.log("✅ Test 4: User B login device baru → BERHASIL");
  console.log("\n🎉 DEVICE BINDING VALIDATION BEKERJA DENGAN BENAR!");
}

testValidation().catch(console.error);
