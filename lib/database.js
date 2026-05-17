import { createClient } from '@supabase/supabase-js';

// URL baru kamu sudah terpasang dengan benar di sini
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://rtvkgdfjzsxhwaqbiren.supabase.co";

// ⚠️ PASTE TOKENS/ANON KEY SUPABASE BARU KAMU DI DALAM TANDA KUTIP DI BAWAH INI:
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dmtnZGZqenN4aHdhcWJpcmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYxMTgsImV4cCI6MjA5NDYxMjExOH0.SVCtYQcPXs07Eou9B6h_uzUozz1fKXbJ5mIlh6YtTtU";

let supabaseInstance = null;

try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error("🚨 Kritis: URL atau KEY Supabase tidak terbaca!");
  }
} catch (e) {
  console.error("🚨 Gagal inisialisasi Supabase Client:", e.message);
}

export const supabase = supabaseInstance;

/**
 * Mengambil data user berdasarkan API Key (Versi Kebal Duplikat & Kebal Crash)
 */
export async function getUser(apikey) {
  if (!apikey || !supabaseInstance) return null;
  
  const cleanApiKey = String(apikey).trim();
  
  try {
    const { data, error } = await supabaseInstance
      .from('api_users')
      .select('*')
      .eq('apikey', cleanApiKey)
      .limit(1); // Mengamankan error 'multiple rows returned'
    
    if (error) {
      console.error("❌ ERROR QUERY SUPABASE:", error.message);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("🚨 Terjadi gangguan jaringan database:", err.message);
    return null;
  }
}
