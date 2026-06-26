// src/app/admin/listings/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN — DEVICE LISTINGS MODERATION — /admin/listings
//
// Server Component: fetches all device listings with seller info.
// Passes data to <ListingsTable> (client) for search/filter/actions.
//
// Data fetched per listing:
//   • Title, brand, category, condition, price, status
//   • Images (cover photo for thumbnail)
//   • Seller: username, verified status
//   • View count, is_featured, is_verified
//   • Created / updated timestamps
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import ListingsTable from '@/components/admin/ListingsTable'

// ── Shape passed to the client table component ────────────────────
export interface AdminListing {
    id: string
    title: string
    price: number
    originalPrice: number
    condition: string
    status: 'active' | 'inactive' | 'sold' | 'pending_review'
    images: string[]
    storageCapacity: string | null
    color: string | null
    batteryHealth: number | null
    viewCount: number
    isFeatured: boolean
    isVerified: boolean
    imeiStatus: 'clean' | 'flagged' | null
    createdAt: string
    updatedAt: string
    // Joined
    brandName: string | null
    categoryName: string | null
    categorySlug: string | null
    sellerUsername: string | null
    sellerId: string | null
    sellerVerified: string | null
}

async function fetchAllListings(): Promise<AdminListing[]> {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data, error } = await supabase
        .from('products')
        .select(`
            id, title, price, original_price, condition, status,
            images, storage_capacity, color, battery_health,
            view_count, is_featured, is_verified, imei_status,
            created_at, updated_at,
            brand:brands ( name ),
            category:categories ( name, slug ),
            seller:users!seller_id ( id, username, verified )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

    if (error || !data) {
        console.error('[admin/listings] fetch error:', error?.message)
        return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
        id:              row.id,
        title:           row.title ?? '—',
        price:           Number(row.price ?? 0),
        originalPrice:   Number(row.original_price ?? 0),
        condition:       row.condition ?? 'good',
        status:          row.status ?? 'active',
        images:          Array.isArray(row.images) ? row.images : [],
        storageCapacity: row.storage_capacity ?? null,
        color:           row.color ?? null,
        batteryHealth:   row.battery_health ? Number(row.battery_health) : null,
        viewCount:       Number(row.view_count ?? 0),
        isFeatured:      Boolean(row.is_featured),
        isVerified:      Boolean(row.is_verified),
        imeiStatus:      row.imei_status ?? null,
        createdAt:       row.created_at,
        updatedAt:       row.updated_at,
        brandName:       row.brand?.name ?? null,
        categoryName:    row.category?.name ?? null,
        categorySlug:    row.category?.slug ?? null,
        sellerUsername:  row.seller?.username ?? null,
        sellerId:        row.seller?.id ?? null,
        sellerVerified:  row.seller?.verified ?? null,
    }))
}

export default async function AdminListingsPage() {
    const listings = await fetchAllListings()

    // Compute summary counts for stat cards
    const counts = {
        total:         listings.length,
        active:        listings.filter(l => l.status === 'active').length,
        pending:       listings.filter(l => l.status === 'pending_review').length,
        flagged:       listings.filter(l => l.imeiStatus === 'flagged').length,
        featured:      listings.filter(l => l.isFeatured).length,
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Listing Moderation</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    {listings.length.toLocaleString()} total listings — review, approve, feature, or remove.
                </p>
            </div>

            {/* Quick stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                {[
                    { label: 'Total',         value: counts.total,   color: 'gray'   },
                    { label: 'Active',         value: counts.active,  color: 'teal'   },
                    { label: 'Pending Review', value: counts.pending, color: 'amber', urgent: counts.pending > 0  },
                    { label: 'IMEI Flagged',   value: counts.flagged, color: 'red',   urgent: counts.flagged > 0  },
                    { label: 'Featured',       value: counts.featured,color: 'purple' },
                ].map(({ label, value, color, urgent }) => {
                    const colorMap: Record<string, string> = {
                        gray:   'bg-white border-gray-100 text-gray-900',
                        teal:   'bg-teal-50 border-teal-200 text-teal-900',
                        amber:  urgent ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-gray-100 text-gray-900',
                        red:    urgent ? 'bg-red-50 border-red-200 text-red-900' : 'bg-white border-gray-100 text-gray-900',
                        purple: 'bg-purple-50 border-purple-100 text-purple-900',
                    }
                    return (
                        <div key={label}
                            className={`rounded-xl border shadow-sm px-4 py-3 ${colorMap[color]}`}>
                            <p className="text-xl font-black leading-none mb-0.5">{value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                {label}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Client-side interactive table */}
            <ListingsTable listings={listings} />
        </div>
    )
}

export const metadata = {
    title: 'Listing Moderation — Go2Hand Admin',
}