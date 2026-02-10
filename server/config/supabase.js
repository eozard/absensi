import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  throw new Error(
    "SUPABASE_URL dan SUPABASE_ANON_KEY atau SUPABASE_SERVICE_ROLE_KEY harus didefinisikan di .env",
  );
}

const supabaseKey = supabaseServiceKey || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
