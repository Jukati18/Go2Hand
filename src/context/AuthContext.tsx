'use client'

// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────
// Provides real-time Supabase session state to the entire app.
//
// Flow:
//   Server Action sets/clears cookie
//   → caller invokes reloadSession()
//   → we call supabase.auth.getSession() to read the new cookie value
//   → state updates → Navbar re-renders with correct avatar / buttons
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

// Singleton browser client — safe to create at module level
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
    /** Force a fresh session read from the cookie.
     *  Call this immediately after a Server Action sign-in/sign-out
     *  so the Navbar updates without requiring a full page refresh. */
    reloadSession: () => Promise<void>
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
            // Profile row may not exist yet (e.g. mid sign-up) — fail silently
            setProfile(null)
        }
    }, [])

    // ── PUBLIC: force re-fetch profile only (e.g. after profile edit) ─
    const refreshProfile = useCallback(async () => {
        if (!user) return
        await fetchProfile(user.id, user.email ?? null)
    }, [user, fetchProfile])

    // ── PUBLIC: re-read the session cookie and sync all state ─────
    // This is the key fix. After a Server Action mutates the auth cookie,
    // call this to make the client aware of the change immediately.
    const reloadSession = useCallback(async () => {
        setLoading(true)
        try {
            // getSession() reads from the cookie — picks up server-side changes
            const { data: { session: newSession } } = await supabase.auth.getSession()

            setSession(newSession)
            setUser(newSession?.user ?? null)

            if (newSession?.user) {
                await fetchProfile(newSession.user.id, newSession.user.email ?? null)
            } else {
                // Signed out — clear profile
                setProfile(null)
            }
        } finally {
            setLoading(false)
        }
    }, [fetchProfile])

    // ── Bootstrap: read existing session on mount ─────────────────
    useEffect(() => {
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

        // Subscribe to auth events: OAuth callback, token refresh,
        // and crucially SIGNED_OUT when supabase.auth.signOut() is called.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // On sign-out: clear everything immediately without async work
                if (event === 'SIGNED_OUT' || !session) {
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                    return
                }

                setSession(session)
                setUser(session.user)

                if (session.user) {
                    await fetchProfile(session.user.id, session.user.email ?? null)
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
            reloadSession,
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