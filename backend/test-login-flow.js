import fetch from "node-fetch";

const API_URL = "http://localhost:5000/api";

console.log("🧪 Testing Complete Login Flow with Device Binding\n");

async function testLoginFlow() {
  // Generate device ID (simulate frontend)
  const deviceId = `device_test_${Date.now()}`;

  console.log("📱 Device ID:", deviceId);
  console.log("👤 Testing login for user: enamenam");
  console.log("🔑 Password: 123456\n");

  try {
    // Simulate login request
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nama: "enamenam",
        password: "123456",
        deviceId: deviceId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ LOGIN FAILED!");
      console.error("Status:", response.status);
      console.error("Message:", data.message);
      console.error("Full error:", data);
      return;
    }

    console.log("✅ LOGIN SUCCESS!");
    console.log("Response:", JSON.stringify(data, null, 2));

    // Now check if device was added to device_bindings
    console.log("\n🔍 Checking device_bindings in database...");

    // Import supabase to check
    const { supabase } = await import("./config/supabase.js");

    const { data: bindings, error } = await supabase
      .from("device_bindings")
      .select("*")
      .eq("device_id", deviceId);

    if (error) {
      console.error("❌ Error checking device_bindings:", error.message);
    } else if (bindings && bindings.length > 0) {
      console.log("✅ DEVICE FOUND IN device_bindings:");
      console.log(JSON.stringify(bindings, null, 2));
    } else {
      console.log("❌ DEVICE NOT FOUND in device_bindings table!");
      console.log("This is the problem - device should be inserted!");
    }

    // Also check user.devices
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("devices")
      .eq("nama", "enamenam");

    if (!userError && users && users.length > 0) {
      console.log("\n📋 User devices array:");
      console.log(JSON.stringify(users[0].devices, null, 2));
    }
  } catch (error) {
    console.error("❌ REQUEST FAILED!");
    console.error("Error:", error.message);
  }
}

testLoginFlow().catch(console.error);
