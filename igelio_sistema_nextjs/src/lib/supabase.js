import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente publico (para uso en el navegador)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin (para uso solo en el servidor - tiene acceso total)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
