import { createClient } from '@supabase/supabase-js';

// Mengambil kredensial dari Environment Variables Vercel
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://rtvkgdfjzsxhwaqbiren.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";

// Proteksi inisialisasi agar tidak crash jika key kosong
let supabaseInstance = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (initErr) {
    console.error("🚨 Gagal membuat client Supabase:", initErr.message);
  }
} else {
  console.error("🚨 Kritis: URL atau KEY Supabase tidak terbaca di .env!");
}

export const supabase = supabaseInstance;

/**
 * Mengambil data user berdasarkan API Key secara aman dan bersih dari syntax error
 */
export async function getUser(apikey) {
  if (!apikey || !supabaseInstance) return null;
  
  const cleanApiKey = String(apikey).trim();
  
  try {
    const { data, error, status } = await supabaseInstance
      .from('api_users')
      .select('*')
      .eq('apikey', cleanApiKey)
      .maybeSingle();
    
    // Log pembantu untuk melihat respon asli database di Vercel Logs
    console.log("==========================================");
    console.log("🔍 CEK APIKEY:", cleanApiKey);
    console.log("📊 STATUS SUPABASE:", status);
    
    if (error) {
      console.error("❌ ERROR SUPABASE:", error.message);
      return null;
    }
    
    console.log("📦 DATA USER:", data);
    console.log("==========================================");
    
    return data || null;
  } catch (err) {
    console.error("🚨 Jaringan database terganggu:", err.message);
    return null;
  }
}
