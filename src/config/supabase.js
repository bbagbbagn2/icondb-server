/**
 * Supabase 클라이언트 설정
 * @description 모든 데이터베이스 작업의 진입점
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase configuration in .env file");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
