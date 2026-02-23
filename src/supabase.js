const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

module.exports = supabase;
