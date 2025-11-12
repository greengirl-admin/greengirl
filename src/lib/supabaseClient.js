import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são carregadas pelo Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in .env file");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
