import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function createIzinTable() {
  try {
    console.log("🔄 Creating izin table...");

    // SQL untuk create table izin
    const sql = `
      CREATE TABLE IF NOT EXISTS izin (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kelompok VARCHAR(100),
        tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
        keterangan TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_izin_nama ON izin(nama);
      CREATE INDEX IF NOT EXISTS idx_izin_tanggal ON izin(tanggal);
      CREATE INDEX IF NOT EXISTS idx_izin_status ON izin(status);
    `;

    // Jalankan query menggunakan admin API
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error("❌ Error creating table:", error.message);

      // Alternative: gunakan PostgreSQL direct query jika RPC tidak tersedia
      console.log("\n⚠️  RPC tidak tersedia. Coba alternatif...");
      console.log("\nGunakan cara manual:");
      console.log("1. Buka Supabase Dashboard");
      console.log("2. Ke SQL Editor");
      console.log("3. Copy-paste dan jalankan SQL berikut:\n");
      console.log(sql);
      process.exit(1);
    }

    console.log("✅ Table izin berhasil dibuat!");
    console.log("📊 Index juga berhasil dibuat");

    // Test table
    const { data: testData, error: testError } = await supabase
      .from("izin")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Table ada tapi tidak bisa diakses:", testError.message);
      process.exit(1);
    }

    console.log("\n✅ Table siap digunakan!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);

    console.log("\n🔧 CARA MANUAL:");
    console.log("1. Buka: https://app.supabase.com");
    console.log("2. Pilih project Anda");
    console.log("3. Ke menu SQL Editor");
    console.log("4. Klik 'New Query'");
    console.log("5. Copy-paste SQL ini:\n");

    const sql = `
CREATE TABLE IF NOT EXISTS izin (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_izin_nama ON izin(nama);
CREATE INDEX IF NOT EXISTS idx_izin_tanggal ON izin(tanggal);
CREATE INDEX IF NOT EXISTS idx_izin_status ON izin(status);
    `;
    console.log(sql);
    console.log("\n6. Klik 'Run' (Ctrl+Enter)");
    console.log("7. Refresh browser");

    process.exit(1);
  }
}

createIzinTable();
