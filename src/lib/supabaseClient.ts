// src/lib/supabaseClient.ts — must re-export the SAME singleton, not create a second client
import { createClient } from './supabase/client'

export const supabase = createClient()