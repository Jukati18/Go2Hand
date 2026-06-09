'use client'

// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────
// Provides real-time Supabase session state to the entire app.
//
// Change from old version:
//   OLD: import { supabase } from '@/lib/supabaseClient'
//        → used createClient() from @supabase/supabase-js directly
//   NEW: import { createClient } from '@/lib/supabase/client'
//        → uses createBrowserClient from @supabase/ssr which stores
//          sessions in cookies (not localStorage) for SSR compat.
//
// Everything else — onAuthStateChange, profile fetch, 14-day
// persistence — works identically.
// ─────────────────────────────────────────────────────────────────

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Create the client once outside the component so it's a stable singleton.
// createBrowserClient is safe to call at module level.
const supabase = createClient()

export interface AuthProfile {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
    email: string | null
}

interface AuthContextValue {
    user: User | null
    profile: AuthProfile | null
    session: Session | null
    loading: boolean
    isAuthenticated: boolean
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user,    setUser]    = useState<User | null>(null)
    const [profile, setProfile] = useState<AuthProfile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    // ── Fetch our custom profile row from the users table ─────────
    const fetchProfile = useCallback(async (userId: string, email: string | null) => {
        try {
            const { data } = await supabase
                .from('users')
                .select('id, username, full_name, avatar_url')
                .eq('id', userId)
                .single()

            if (data) {
                setProfile({
                    id:        data.id,
                    username:  data.username ?? 'user',
                    fullName:  data.full_name ?? null,
                    avatarUrl: data.avatar_url ?? null,
                    email,
                })
            }
        } catch {
            // Profile row may not exist yet (e.g. mid sign-up) — fail silently.
            setProfile(null)
        }
    }, [])

    // ── Public: force re-fetch (called after profile edit) ────────
    const refreshProfile = useCallback(async () => {
        if (!user) return
        await fetchProfile(user.id, user.email ?? null)
    }, [user, fetchProfile])

    // ── Bootstrap: read existing session on mount ─────────────────
    useEffect(() => {
        // getSession() is safe on the CLIENT SIDE (browser).
        // The phantom-session bug only affects SERVER-SIDE code (proxy).
        // Here in the browser, getSession() reads the real cookie value.
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                fetchProfile(session.user.id, session.user.email ?? null)
                    .finally(() => setLoading(false))
            } else {
                setLoading(false)
            }
        })

        // Subscribe to auth events: login, logout, token refresh, OAuth callback
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email ?? null)
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [fetchProfile])

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            isAuthenticated: !!user,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}