// lib/deviceService.ts
// ─────────────────────────────────────────────────────────────────
// Fetches data from Supabase and maps it to the existing Device
// type (src/types/device.ts) so all UI components stay unchanged.
// ─────────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient'
import type { Device, Seller } from '@/types/device'

// ── Supabase condition → local grade + conditionLabel ─────────────
function mapCondition(condition: string): { grade: Device['grade']; conditionLabel: Device['conditionLabel'] } {
    switch (condition) {
        case 'like_new': return { grade: 'A+', conditionLabel: 'Excellent' }
        case 'excellent': return { grade: 'A', conditionLabel: 'Excellent' }
        case 'good': return { grade: 'B', conditionLabel: 'Good' }
        case 'fair': return { grade: 'C', conditionLabel: 'Fair' }
        default: return { grade: 'C', conditionLabel: 'Fair' }
    }
}

// ── Generate initials from name ────────────────────────────────────
function toInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Rotate through avatar gradient colours ─────────────────────────
const AVATAR_COLORS = [
    'from-teal-500 to-emerald-500',
    'from-violet-500 to-purple-500',
    'from-orange-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
]
function pickColor(seed: string): string {
    const idx = seed.charCodeAt(0) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx]
}

// ── Map a raw Supabase product row → Device ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): Device {
    const { grade, conditionLabel } = mapCondition(row.condition ?? 'good')

    const sellerData = row.seller ?? {}
    const sellerName = sellerData.full_name ?? sellerData.username ?? 'Unknown Seller'

    const seller: Seller = {
        id: sellerData.id ?? '',
        name: sellerName,
        initials: toInitials(sellerName),
        avatarColor: pickColor(sellerData.id ?? 'x'),
        isVerified: sellerData.verified === 'verified',
        memberSince: sellerData.created_at
            ? new Date(sellerData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'Unknown',
        location: sellerData.location ?? 'Vietnam',
        rating: sellerData.seller_rating ?? 0,
        totalSales: sellerData.total_sales ?? 0,
        responseTime: '< 2hrs',
    }

    // Parse storage options from specs JSON if available
    const specs = row.specs ?? {}
    const storageVal = row.storage_capacity ?? specs.storage ?? '—'

    // Build DeviceSpec array from Supabase specs JSON
    const deviceSpecs = [
        { label: 'Brand', value: row.brand?.name ?? '—' },
        { label: 'Storage', value: storageVal, highlighted: true },
        { label: 'RAM', value: specs.ram ?? '—' },
        { label: 'Display', value: specs.display ?? '—' },
        { label: 'Processor', value: specs.chip ?? specs.cpu ?? '—' },
        { label: 'Camera', value: specs.camera ?? '—' },
        { label: 'Battery', value: specs.battery ?? '—' },
        { label: 'OS', value: specs.os ?? '—' },
        {
            label: 'IMEI Status',
            value: row.imei_status === 'clean' ? '✓ Clean — Not Blacklisted' : '⚠ Check required',
            highlighted: row.imei_status === 'clean',
        },
    ].filter(s => s.value !== '—')

    return {
        id: row.id,
        brand: row.brand?.name ?? '—',
        model: row.device_model?.model_name ?? row.title ?? '—',
        fullName: row.title ?? '—',
        storage: storageVal,
        color: row.color ?? '—',
        grade,
        conditionLabel,
        price: Number(row.price) ?? 0,
        originalPrice: Number(row.original_price) ?? 0,
        images: Array.isArray(row.images) ? row.images : [],
        isVerified: Boolean(row.is_verified),
        inspectedDate: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—',
        batteryHealth: row.battery_health ?? 0,
        conditionChecks: [],     // populated separately from verification_logs if needed
        specs: deviceSpecs,
        seller,
        reviews: [],      // loaded separately
        totalReviews: 0,
        averageRating: 0,
        shippingProvider: 'J&T Express',
        shippingDays: '2–4 days',
        imeiStatus: row.imei_status === 'flagged' ? 'flagged' : 'clean',
        iCloudStatus: row.icloud_status === 'locked' ? 'locked' : 'unlocked',
        carrierStatus: row.carrier_status === 'locked' ? 'locked' : 'unlocked',
        availableStorage: [storageVal],
        storagePrices: { [storageVal]: Number(row.price) ?? 0 },
        category: row.category?.name ?? '—',
    }
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

// Shared select string — keeps queries DRY
const PRODUCT_SELECT = `
  *,
  seller:users!seller_id ( id, username, full_name, avatar_url, seller_rating,
                           total_sales, verified, location, created_at ),
  brand:brands ( id, name, slug, logo_url ),
  category:categories ( id, name, slug ),
  device_model:device_models ( id, model_name )
`

/** Featured devices for the homepage grid */
export async function getFeaturedDevices(limit = 8): Promise<Device[]> {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('getFeaturedDevices:', error.message)
        return []
    }
    return (data ?? []).map(mapProduct)
}

export interface ListingFilters {
    category?: string   // slug
    brand?: string   // slug
    condition?: string
    minPrice?: number
    maxPrice?: number
    search?: string
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
    page?: number
    limit?: number
}

/** Paginated product listing with filters */
export async function getDevices(filters: ListingFilters = {}): Promise<{ devices: Device[]; total: number }> {
    const { category, brand, condition, minPrice, maxPrice, search, sortBy = 'newest', page = 1, limit = 20 } = filters

    let query = supabase
        .from('products')
        .select(PRODUCT_SELECT, { count: 'exact' })
        .eq('status', 'active')

    if (condition) query = query.eq('condition', condition)
    if (minPrice) query = query.gte('price', minPrice)
    if (maxPrice) query = query.lte('price', maxPrice)
    if (search) query = query.ilike('title', `%${search}%`)

    if (category) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single()
        if (cat) query = query.eq('category_id', cat.id)
    }
    if (brand) {
        const { data: b } = await supabase.from('brands').select('id').eq('slug', brand).single()
        if (b) query = query.eq('brand_id', b.id)
    }

    switch (sortBy) {
        case 'price_asc': query = query.order('price', { ascending: true }); break
        case 'price_desc': query = query.order('price', { ascending: false }); break
        case 'popular': query = query.order('view_count', { ascending: false }); break
        default: query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * limit
    const { data, error, count } = await query.range(from, from + limit - 1)

    if (error) {
        console.error('getDevices:', error.message)
        return { devices: [], total: 0 }
    }
    return { devices: (data ?? []).map(mapProduct), total: count ?? 0 }
}

/** Single device detail page */
export async function getDeviceById(id: string): Promise<Device | null> {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('id', id)
        .eq('status', 'active')
        .single()

    if (error) {
        console.error('getDeviceById:', error.message)
        return null
    }

    // Increment view count (fire-and-forget, don't await)
    supabase.from('products').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', id).then(() => { })

    return mapProduct(data)
}

/** Similar devices (same category, different id) */
export async function getSimilarDevices(categoryId: string, excludeId: string, limit = 4): Promise<Device[]> {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('category_id', categoryId)
        .neq('id', excludeId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) return []
    return (data ?? []).map(mapProduct)
}