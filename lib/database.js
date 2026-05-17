import { createClient } from '@supabase/supabase-js';

// Mengambil dari ENV Vercel yang baru
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rtvkgdfjzdbxbn.supabase.co";
// ⚠️ Jika ENV di Vercel masih membandel, paste KEY yang valid langsung di dalam tanda kutip di bawah ini sebagai cadangan:
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "MASUKKAN_ANON_KEY_SUPABASE_YANG_ASLI_DI_SINI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Mengambil data user berdasarkan API Key secara aman
 */
export async function getUser(apikey) {
  if (!apikey) return null;
  const cleanApiKey = String(apikey).trim();
  
  try {
    const { data, error, status } = await supabase
      .from('api_users')
      .select('*')
      .eq('apikey', cleanApiKey)
      .maybeSingle();
    
    // 🛠️ LOG DEBUGGING UNTUK SUPABASE
    console.log("==========================================");
    console.log("🔍 SEDANG MEMERIKSA APIKEY:", cleanApiKey);
    console.log("📊 STATUS RESPON SUPABASE:", status);
    if (error) {
      console.error("❌ EROR DARI SUPABASE:", error.message);
    } else {
      console.log("📦 DATA YANG DITEMUKAN:", data);
    }
    console.log("==========================================");
    
    if (error) return null;
    return data || null;
  } catch (err) {
    console.error("🚨 CRASH PADA FUNGSI GETUSER:", err.message);
    return null;
  }
}
  
  try {
    const { data, error } = await supabase
      .from('api_users')
      .select('*')
      .eq('apikey', apikey.trim())
      .maybeSingle();
    
    if (error) {
      console.error("⚠️ Supabase bermasalah:", error.message);
      return null;
    }
    
    return data || null;
  } catch (err) {
    // Jika Supabase diblokir/down, tangkap error di sini agar tidak merusak index utama
    console.error("🚨 Sistem database crash:", err.message);
    return null;
  }
  }
