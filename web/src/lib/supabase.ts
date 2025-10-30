import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : (null as unknown as ReturnType<typeof createClient>)

export const TABLE_CALCULATIONS = 'calculations'