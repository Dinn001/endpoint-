import { createClient } from '@supabase/supabase-js';

// ⚠️ ISI DENGAN KREDENSIAL SUPABASE KAMU
const SUPABASE_URL = "https://rtvkgdfjzsxhwaqbiren.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dmtnZGZqenN4aHdhcWJpcmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYxMTgsImV4cCI6MjA5NDYxMjExOH0.SVCtYQcPXs07Eou9B6h_uzUozz1fKXbJ5mIlh6YtTtU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Mengambil data user berdasarkan API Key secara real-time
 */
export async function getUser(apikey) {
  if (!apikey) return null;
  
  const { data, error } = await supabase
    .from('api_users')
    .select('*')
    .eq('apikey', apikey.trim())
    .maybeSingle();
  
  if (error || !data) return null;
  return data;
}
