// src/app/admin/users/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN — USER MANAGEMENT — /admin/users
//
// Server Component: fetches all users from Supabase with stats.
// Passes data to <UserTable> (client) for search/filter/actions.
//
// Data fetched:
//   • All users with profile info
//   • Per-user: listing count, order count (buyer + seller)
//   • Verification status, role, join date
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import UserTable from '@/components/admin/UserTable'

export interface AdminUser {
    id: string
    username: string
    fullName: string | null
    email: string | null
    avatarUrl: string | null
    role: 'buyer' | 'seller' | 'admin'
    verified: string | null          // 'verified' | 'pending' | null
    sellerRating: number
    totalSales: number
    totalReviews: number
    location: string | null
    createdAt: string
    // Derived counts
    listingCount: number
    buyerOrderCount: number
}

async function fetchAllUsers(): Promise<AdminUser[]> {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // ── Fetch users ────────────────────────────────────────────────
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, username, full_name, avatar_url, role,
            verified, seller_rating, total_sales, total_reviews,
            location, created_at
        `)
        .order('created_at', { ascending: false })
        .limit(500)   // cap for MVP — add pagination if catalogue grows

    if (error || !users) {
        console.error('[admin/users] fetch error:', error?.message)
        return []
    }

    // ── Batch: listing counts per seller ──────────────────────────
    const userIds = users.map(u => u.id)

    const [listingRes, buyerOrderRes] = await Promise.all([
        supabase
            .from('products')
            .select('seller_id')
            .in('seller_id', userIds)
            .in('status', ['active', 'inactive', 'sold']),

        supabase
            .from('orders')
            .select('buyer_id')
            .in('buyer_id', userIds),
    ])

    // Build count maps
    const listingCounts: Record<string, number> = {}
    for (const row of listingRes.data ?? []) {
        listingCounts[row.seller_id] = (listingCounts[row.seller_id] ?? 0) + 1
    }

    const buyerOrderCounts: Record<string, number> = {}
    for (const row of buyerOrderRes.data ?? []) {
        buyerOrderCounts[row.buyer_id] = (buyerOrderCounts[row.buyer_id] ?? 0) + 1
    }

    return users.map(u => ({
        id:              u.id,
        username:        u.username ?? 'unknown',
        fullName:        u.full_name ?? null,
        email:           null,       // email is in auth.users — not exposed for privacy
        avatarUrl:       u.avatar_url ?? null,
        role:            (u.role ?? 'buyer') as AdminUser['role'],
        verified:        u.verified ?? null,
        sellerRating:    Number(u.seller_rating ?? 0),
        totalSales:      Number(u.total_sales ?? 0),
        totalReviews:    Number(u.total_reviews ?? 0),
        location:        u.location ?? null,
        createdAt:       u.created_at,
        listingCount:    listingCounts[u.id]    ?? 0,
        buyerOrderCount: buyerOrderCounts[u.id] ?? 0,
    }))
}

export default async function AdminUsersPage() {
    const users = await fetchAllUsers()

    return (
        <div className="flex flex-col gap-5">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    {users.length.toLocaleString()} registered users — search, filter, and manage accounts.
                </p>
            </div>

            {/* Interactive table — client component */}
            <UserTable users={users} />
        </div>
    )
}

export const metadata = {
    title: 'User Management — Go2Hand Admin',
}