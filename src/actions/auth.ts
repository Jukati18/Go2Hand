'use server'

// src/actions/auth.ts
// ─────────────────────────────────────────────────────────────────
// Auth server actions — run on the server even when called from
// a client component. Uses @supabase/ssr so session cookies are
// properly set and refreshed.
//
// Actions:
//   actionSignIn    — email + password login
//   actionSignUp    — register new user (creates profile row too)
//   actionSignOut   — clear session
// ─────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

type ActionResult = {
    success: boolean
    error?: string
}

// ── Build a server-side Supabase client that reads/writes cookies ─
async function createSupabaseServer() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from a Server Component — safe to ignore.
                    }
                },
            },
        }
    )
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
export async function actionSignIn(
    formData: FormData
): Promise<ActionResult> {
    const email    = (formData.get('email')    as string)?.trim().toLowerCase()
    const password = formData.get('password') as string

    // Basic server-side validation (client already validates, but
    // we never trust the client exclusively)
    if (!email || !password) {
        return { success: false, error: 'Email and password are required.' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Please enter a valid email address.' }
    }

    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        return { success: false, error: friendlyError(error.message) }
    }

    // Revalidate everything so server components re-fetch with
    // the new session (e.g. Navbar user info).
    revalidatePath('/', 'layout')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// SIGN UP — creates auth user + profile row in users table
// ─────────────────────────────────────────────────────────────────
export async function actionSignUp(
    formData: FormData
): Promise<ActionResult> {
    const username = (formData.get('username') as string)?.trim()
    const email    = (formData.get('email')    as string)?.trim().toLowerCase()
    const password = formData.get('password') as string

    // ── Server-side validation ──
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

    const supabase = await createSupabaseServer()

    // ── Check username availability (optional — remove if no unique index) ──
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
        options: {
            data: { username }, // stored in raw_user_meta_data
        },
    })

    if (authError) {
        return { success: false, error: friendlyError(authError.message) }
    }

    // ── Create profile row (matches auth.uid()) ───────────────────
    // This may fail if email confirmation is required and user
    // isn't confirmed yet — that's OK, a trigger can handle it,
    // or we catch gracefully.
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id:       authData.user.id,
                email,
                username,
                role:     'buyer',
            })

        if (profileError && !profileError.message.includes('duplicate')) {
            console.error('Profile creation failed:', profileError.message)
            // Non-fatal — auth user was created successfully
        }
    }

    // Check whether Supabase requires email confirmation
    const needsConfirmation = !authData.session

    revalidatePath('/', 'layout')
    return {
        success: true,
        // Use the error field as a "soft" message when email confirmation is needed
        error: needsConfirmation
            ? 'CHECK_EMAIL'  // signals the UI to show a "check your inbox" screen
            : undefined,
    }
}

// ─────────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────────
export async function actionSignOut(): Promise<ActionResult> {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.signOut()

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}