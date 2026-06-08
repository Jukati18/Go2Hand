'use client'

// ============================================
// AUTH CONTEXT — src/context/AuthContext.tsx
//
// Provides real-time Supabase session state to the
// entire app via React Context.
//
// Features:
//  • Subscribes to onAuthStateChange for instant updates
//  • 14-day session persistence via Supabase's built-in
//    localStorage token storage (configurable)
//  • Exposes: user, profile, loading, isAuthenticated
//  • Profile fetched from `users` table after login
//
// Usage in any component:
//   const { user, profile, isAuthenticated } = useAuth()
// ============================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

// ── Public profile shape (mirrors what Navbar needs) ─────────────
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
    /** Call after login/signup to manually re-fetch profile */
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user,    setUser]    = useState<User | null>(null)
    const [profile, setProfile] = useState<AuthProfile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)  // true until first auth check

    // ── Fetch profile from users table ────────────────────────────
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
            // Profile may not exist yet (e.g. mid-signup) — fail silently
            setProfile(null)
        }
    }, [])

    // ── Public: force re-fetch (called after profile edit) ────────
    const refreshProfile = useCallback(async () => {
        if (!user) return
        await fetchProfile(user.id, user.email ?? null)
    }, [user, fetchProfile])

    // ── Bootstrap: check existing session on mount ────────────────
    useEffect(() => {
        // getSession() reads from localStorage — instant, no network needed
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

        // ── Subscribe to auth state changes ───────────────────────
        // This fires on: login, logout, token refresh, OAuth callback
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email ?? null)
                } else {
                    // Signed out
                    setProfile(null)
                }

                // Stop showing the loading spinner after the first real event
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

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}