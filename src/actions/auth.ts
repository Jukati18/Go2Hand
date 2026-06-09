'use server'

// src/actions/auth.ts
// ─────────────────────────────────────────────────────────────────
// Auth server actions — signIn, signUp, signOut.
//
// Uses createClient() from @/lib/supabase/server (the correct
// server-side client that reads/writes cookies via next/headers).
// ─────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = {
    success: boolean
    error?: string
}

// ── Map Supabase error messages → friendly copy ───────────────────
function friendlyError(message: string): string {
    if (message.includes('Invalid login credentials'))
        return 'Incorrect email or password. Please try again.'
    if (message.includes('Email not confirmed'))
        return 'Please verify your email address before signing in.'
    if (message.includes('User already registered'))
        return 'An account with this email already exists. Try signing in.'
    if (message.includes('Password should be at least'))
        return 'Password must be at least 8 characters.'
    if (message.includes('rate limit'))
        return 'Too many attempts. Please wait a minute and try again.'
    return message
}

// ─────────────────────────────────────────────────────────────────
// SIGN IN — email + password
// ─────────────────────────────────────────────────────────────────
export async function actionSignIn(formData: FormData): Promise<ActionResult> {
    const email    = (formData.get('email')    as string)?.trim().toLowerCase()
    const password =  formData.get('password') as string

    if (!email || !password) {
        return { success: false, error: 'Email and password are required.' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Please enter a valid email address.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { success: false, error: friendlyError(error.message) }

    // Revalidate the entire layout so Server Components re-render
    // with the new session (Navbar user info, protected pages, etc.)
    revalidatePath('/', 'layout')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// SIGN UP — creates auth user + profile row in users table
// ─────────────────────────────────────────────────────────────────
export async function actionSignUp(formData: FormData): Promise<ActionResult> {
    const username = (formData.get('username') as string)?.trim()
    const email    = (formData.get('email')    as string)?.trim().toLowerCase()
    const password =  formData.get('password') as string

    // ── Server-side validation ────────────────────────────────────
    if (!username || !email || !password) {
        return { success: false, error: 'All fields are required.' }
    }
    if (username.length < 3 || username.length > 20) {
        return { success: false, error: 'Username must be 3–20 characters.' }
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            success: false,
            error: 'Username may only contain letters, numbers, and underscores.',
        }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Please enter a valid email address.' }
    }
    if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' }
    }

    const supabase = await createClient()

    // ── Check username availability ───────────────────────────────
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()

    if (existingUser) {
        return {
            success: false,
            error: 'This username is already taken. Please choose another.',
        }
    }

    // ── Create auth user ──────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
    })

    if (authError) return { success: false, error: friendlyError(authError.message) }

    // ── Create profile row ────────────────────────────────────────
    if (authData.user) {
        const { error: profileError } = await supabase.from('users').insert({
            id:       authData.user.id,
            email,
            username,
            role:     'buyer',
        })
        if (profileError && !profileError.message.includes('duplicate')) {
            console.error('Profile creation failed:', profileError.message)
        }
    }

    const needsConfirmation = !authData.session

    revalidatePath('/', 'layout')
    return {
        success: true,
        // Signal the UI to show "check your inbox" when email confirmation is on
        error: needsConfirmation ? 'CHECK_EMAIL' : undefined,
    }
}

// ─────────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────────
export async function actionSignOut(): Promise<ActionResult> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) return { success: false, error: error.message }

    revalidatePath('/', 'layout')
    return { success: true }
}