import { createClient } from '@supabase/supabase-js';

// Mengambil kredensial secara aman dari environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("🚨 Kritis: SUPABASE_URL atau SUPABASE_KEY belum dikonfigurasi di .env!");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Mengambil data user berdasarkan API Key secara aman
 */
export async function getUser(apikey) {
  if (!apikey) return null;
  
  try {
    const { data, error } = await supabase
      .from('api_users')
      .select('*')
      .eq('apikey', apikey.trim())
      .maybeSingle();
    
    if (error) {
      console.error("⚠️ Supabase Query Error:", error.message);
      return null;
    }
    
    return data || null;
  } catch (err) {
    // Menangkap token 'A' dari Cloudflare/jaringan agar tidak merusak handler utama
    console.error("🚨 Koneksi ke database gagal atau diblokir:", err.message);
    return null;
  }
}
