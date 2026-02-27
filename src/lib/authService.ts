// lib/authService.ts
import { supabase } from './supabaseClient'

export async function signUp(email: string, password: string, username: string) {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }  // stored in raw_user_meta_data
    })
    if (authError) throw authError

    // 2. Insert into our users table (matches auth.uid())
    if (authData.user) {
        const { error: profileError } = await supabase.from('users').insert({
            id: authData.user.id,
            email,
            username,
            role: 'buyer',
        })
        if (profileError) throw profileError
    }

    return authData
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
}

export async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
}

export async function signOut() {
    return supabase.auth.signOut()
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch full profile from our users table
    const { data } = await supabase
        .from('users').select('*').eq('id', user.id).single()

    return data
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data
}