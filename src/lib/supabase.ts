import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey!)
  : null

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }
  return supabase
}
