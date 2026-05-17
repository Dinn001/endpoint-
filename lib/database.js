import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://rtvkgdfjzsxhwaqbiren.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dmtnZGZqenN4aHdhcWJpcmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYxMTgsImV4cCI6MjA5NDYxMjExOH0.SVCtYQcPXs07Eou9B6h_uzUozz1fKXbJ5mIlh6YtTtU";

// Langsung buat dan eksport client-nya. Objek ini tidak akan bernilai null.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Mengambil data user berdasarkan API Key secara aman (Mengembalikan Array)
 */
export async function getUser(apikey) {
  if (!apikey) return null;
  
  const cleanApiKey = String(apikey).trim();
  
  try {
    // Kita pakai select biasa tanpa .single() atau .limit() di query agar supabase tidak pusing
    const { data, error } = await supabase
      .from('api_users')
      .select('*')
      .eq('apikey', cleanApiKey);
    
    if (error) {
      console.error("❌ ERROR QUERY SUPABASE:", error.message);
      return null;
    }
    
    // Filter dan potong hasilnya menggunakan JavaScript murni (Jauh lebih aman dari crash)
    if (data && data.length > 0) {
      return data[0]; 
    }
    
    return null;
  } catch (err) {
    console.error("🚨 Terjadi gangguan pada fungsi getUser:", err.message);
    return null;
  }
}
