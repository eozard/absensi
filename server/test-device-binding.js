import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Testing Device Binding Insert...\n");
console.log("Config:", {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
});

// Test dengan ANON key (current setup)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test dengan SERVICE key (jika ada)
const supabaseService = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function testInsert() {
  console.log("\n📝 Test 1: Insert dengan ANON KEY");
  const testData = {
    device_id: `test_device_${Date.now()}`,
    user_name: "testuser",
    kelompok: "test",
    bound_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    usage_count: 1,
  };

  console.log("Data:", testData);

  const { data: anonData, error: anonError } = await supabaseAnon
    .from("device_bindings")
    .insert(testData)
    .select();

  if (anonError) {
    console.error("❌ ANON KEY ERROR:");
    console.error(
      JSON.stringify(
        {
          message: anonError.message,
          code: anonError.code,
          details: anonError.details,
          hint: anonError.hint,
        },
        null,
        2,
      ),
    );
  } else {
    console.log("✅ ANON KEY SUCCESS:", anonData);
  }

  // Test dengan SERVICE key jika ada
  if (supabaseService) {
    console.log("\n📝 Test 2: Insert dengan SERVICE ROLE KEY");
    const testData2 = {
      device_id: `test_device_service_${Date.now()}`,
      user_name: "testuser",
      kelompok: "test",
      bound_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
      usage_count: 1,
    };

    const { data: serviceData, error: serviceError } = await supabaseService
      .from("device_bindings")
      .insert(testData2)
      .select();

    if (serviceError) {
      console.error("❌ SERVICE KEY ERROR:", serviceError.message);
    } else {
      console.log("✅ SERVICE KEY SUCCESS:", serviceData);
    }
  } else {
    console.log("\n⚠️  SUPABASE_SERVICE_ROLE_KEY tidak tersedia di .env");
  }

  // Check RLS status
  console.log("\n🔒 Checking RLS Status...");
  const { data: rlsData, error: rlsError } = await supabaseAnon
    .from("pg_tables")
    .select("tablename, rowsecurity")
    .in("tablename", ["device_bindings", "users", "attendances", "izin"]);

  if (rlsError) {
    console.log("Cannot check RLS (need proper permissions)");
  } else {
    console.log("RLS Status:", rlsData);
  }

  // Try to read from device_bindings
  console.log("\n📖 Reading from device_bindings...");
  const { data: readData, error: readError } = await supabaseAnon
    .from("device_bindings")
    .select("*")
    .limit(5);

  if (readError) {
    console.error("❌ Read ERROR:", readError.message);
  } else {
    console.log(`✅ Can read ${readData?.length || 0} rows:`, readData);
  }
}

testInsert().catch(console.error);
