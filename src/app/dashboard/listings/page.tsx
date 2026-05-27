// src/app/dashboard/listings/page.tsx
// ─────────────────────────────────────────────────────────────────
// MY LISTINGS — Seller Dashboard
//
// Server Component: fetches all of this seller's listings
// (active, sold, inactive, pending_review) then hands them to
// the ListingsManager client component for tab filtering and
// deactivate / reactivate actions.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingsManager from '@/components/dashboard/ListingsManager'
import { getSellerDevices } from '@/services/deviceWriteService'

export default async function DashboardListingsPage() {

    // ── Auth ──────────────────────────────────────────────────────
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
    if (!user) redirect('/login?next=/dashboard/listings')

    // ── Fetch ALL listings for this seller (every status) ─────────
    // getSellerDevices already orders by created_at DESC
    const listings = await getSellerDevices(user.id)

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-1.5 mb-6 text-[12px] text-gray-400 flex-wrap">
                    <Link href="/" aria-label="Home">
                        <HomeIcon className="w-3.5 h-3.5 hover:text-teal-700 transition-colors" />
                    </Link>
                    <ChevronRightIcon className="w-3 h-3" />
                    <Link href="/dashboard"
                        className="hover:text-teal-700 transition-colors">
                        Dashboard
                    </Link>
                    <ChevronRightIcon className="w-3 h-3" />
                    <span className="text-gray-600 font-medium">My Listings</span>
                </nav>

                {/* ListingsManager handles all the interactive filtering & actions */}
                <ListingsManager listings={listings} />
            </div>

            <Footer />
        </div>
    )
}

export const metadata = {
    title: 'My Listings — Go2Hand Dashboard',
}