// src/app/admin/layout.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN LAYOUT — wraps all /admin/* pages
//
// Auth guard: only users with role = 'admin' can access.
// Everyone else is redirected to the homepage.
//
// Layout: sticky top bar + sidebar nav + main content area
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import {
    ShieldCheckIcon,
    ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import AdminNav from '@/components/admin/AdminNav'

async function getAdminUser() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {},
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('users')
        .select('username, full_name, role')
        .eq('id', user.id)
        .single()

    // Only allow role = 'admin'
    if (profile?.role !== 'admin') return null

    return { user, profile }
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const admin = await getAdminUser()

    // Redirect non-admins back to homepage
    if (!admin) redirect('/?error=unauthorized')

    const displayName = admin.profile.full_name ?? admin.profile.username ?? 'Admin'

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Top bar ── */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    {/* Left: badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
                                <ShieldCheckIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 text-sm">
                                Go2Hand <span className="text-red-600">Admin</span>
                            </span>
                        </div>
                        <span className="hidden sm:inline-block bg-red-100 text-red-700 text-[10px] font-bold
                            px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Internal Only
                        </span>
                    </div>

                    {/* Right: user info + back link */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 hidden sm:inline">
                            Signed in as{' '}
                            <span className="font-semibold text-gray-700">{displayName}</span>
                        </span>
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500
                                hover:text-gray-800 border border-gray-200 hover:border-gray-300
                                px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5" />
                            Exit Admin
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Main layout: sidebar + content ── */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* Sidebar nav */}
                    <AdminNav />

                    {/* Page content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}