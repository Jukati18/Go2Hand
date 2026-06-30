// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

const FETCH_TIMEOUT_MS = 15_000

// Wraps the global fetch with a hard AbortController ceiling. This is
// the actual fix: previously only OUR explicit calls (the manual
// getSession() check, the withTimeout() around .upload()) had any
// timeout protection. But supabase-js v2 internally calls
// auth.getSession() before EVERY request (storage, postgrest, auth)
// to attach a fresh access token — and that internal call has no
// timeout of its own. If it stalls (paused project, stuck token
// refresh, flaky network), it can hang forever regardless of what we
// wrap in our own code. Injecting this at the fetch level means
// nothing Supabase does internally can hang indefinitely either.
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    return fetch(input, { ...init, signal: init?.signal ?? controller.signal })
        .finally(() => clearTimeout(timer))
}

// Module-level singleton — createClient() always returns the SAME
// GoTrueClient instance, preventing the navigator.locks contention
// that happens when multiple independent clients share one storage key.
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: { fetch: fetchWithTimeout },
            }
        )
    }
    return client
}