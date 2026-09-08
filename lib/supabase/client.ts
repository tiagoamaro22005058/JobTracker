import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseKey, isConfigured } from './config';
import type { Database } from '@/types/application';
export function createClient() {
  if (!isConfigured) throw new Error('Connect Supabase using the steps in README.md.');
  return createBrowserClient<Database>(supabaseUrl!, supabaseKey!);
}
