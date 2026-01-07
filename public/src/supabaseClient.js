import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://sazdtrcayjljgmihilkj.supabase.co';
const supabaseKey = 'sb_publishable_8PjevXnceWHX2i_xoB-M7g_UYzHxq5c'; // NOT service role key

export const supabase = createClient(supabaseUrl, supabaseKey);

