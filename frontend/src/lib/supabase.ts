import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and/or anon key not provided');
} else {
  console.log("Supbase ")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;