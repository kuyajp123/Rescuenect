import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zepxowlolivaarxfcyxy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseAnonKey) {
  throw new Error('Supabase anon key is not defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
