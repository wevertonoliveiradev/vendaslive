import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// These environment variables are populated automatically when connecting to Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please connect to Supabase to get your API keys.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);