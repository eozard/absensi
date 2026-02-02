import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL dan SUPABASE_ANON_KEY harus didefinisikan di .env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
