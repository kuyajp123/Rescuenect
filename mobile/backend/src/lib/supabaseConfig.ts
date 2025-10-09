import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zepxowlolivaarxfcyxy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // use service key (not anon)
export const supabase = createClient(supabaseUrl, supabaseKey);
