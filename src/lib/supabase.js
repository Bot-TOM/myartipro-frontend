import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || supabaseUrl.includes('xxxx')) {
  console.warn(
    '⚠️ Supabase non configuré. Remplis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans frontend/.env'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
