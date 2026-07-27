// src/lib/supabaseClient.ts
//
// Re-exports the SAME browser singleton from ./supabase/client — must
// never construct a second client instance.
//
// LAZY INIT — WHY:
//   Same reasoning as admin.ts. The previous version called
//   createClient() eagerly at module top level, so importing this file
//   (which dozens of services do: deviceService, categoryService,
//   reviewService, orderService, searchService, storageService,
//   verification actions, authService, etc.) constructed the Supabase
//   client immediately — and would crash `next build`'s page-data
//   collection step if NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//   aren't present in that environment. Deferred via Proxy so the client
//   is only actually built the first time it's used.

import { createClient as createBrowserSingleton } from './supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
    if (!_client) {
        _client = createBrowserSingleton()
    }
    return _client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const instance = getClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (instance as any)[prop]
        return typeof value === 'function' ? value.bind(instance) : value
    },
})