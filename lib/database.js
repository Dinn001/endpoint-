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
 * Mengambil data user berdasarkan API Key (Kebal dari error data duplikat)
 */
export async function getUser(apikey) {
  if (!apikey || !supabaseInstance) return null;
  
  const cleanApiKey = String(apikey).trim();
  
  try {
    // 🛠️ MODIFIKASI: Menggunakan .limit(1) menggantikan .maybeSingle()
    const { data, error, status } = await supabaseInstance
      .from('api_users')
      .select('*')
      .eq('apikey', cleanApiKey)
      .limit(1); // Ini akan mengembalikan Array berisi maksimal 1 data
    
    console.log("==========================================");
    console.log("🔍 CEK APIKEY:", cleanApiKey);
    console.log("📊 STATUS SUPABASE:", status);
    
    if (error) {
      console.error("❌ ERROR SUPABASE:", error.message);
      return null;
    }
    
    // Karena .limit(1) menghasilkan Array, kita ambil indeks ke-0 jika datanya ada
    const user = data && data.length > 0 ? data[0] : null;
    
    console.log("📦 DATA USER YANG DIAMBIL:", user);
    console.log("==========================================");
    
    return user;
  } catch (err) {
    console.error("🚨 Jaringan database terganggu:", err.message);
    return null;
  }
}
