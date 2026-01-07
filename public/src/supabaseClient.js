import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Use the anon/public key for browser (frontend)
const supabaseUrl = "https://sazdtrcayjljgmihilkj.supabase.co"; // your Supabase URL
const supabaseKey = "sb_publishable_8PjevXnceWHX2i_xoB-M7g_UYzHxq5c"; // your anon key

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client
const supabase = supabase.createClient
  ? supabase.createClient(supabaseUrl, supabaseKey)
  : supabaseJs.createClient(supabaseUrl, supabaseKey);

// Expose globally for your script.js
window.supabase = supabase;

export const supabase = createClient(supabaseUrl, supabaseKey);

