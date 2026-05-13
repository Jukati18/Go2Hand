// ============================================
// /api/products — REST API
//
// GET  /api/products              → list devices (with optional query params)
// POST /api/products              → create a new device listing
//
// These REST routes are an ALTERNATIVE to Server Actions.
// Use them when you need to call from:
//   - External services or mobile apps
//   - Client components that prefer fetch() over Server Actions
//   - Postman / API testing
//
// Query params for GET:
//   ?category=smartphones
//   &brand=apple
//   &condition=excellent
//   &min_price=200
//   &max_price=800
//   &search=iphone
//   &sort=price_asc|price_desc|newest|popular
//   &page=1
//   &limit=20
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDevices } from '@/services/deviceService'
import { createProduct } from '@/services/productService'
import type { CreateProductInput } from '@/types/product'
import type { ListingFilters } from '@/services/deviceService'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products
// Returns paginated device listings with optional filters
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl

        // Parse query string into filter object
        const filters: ListingFilters = {
            category: searchParams.get('category') ?? undefined,
            brand: searchParams.get('brand') ?? undefined,
            condition: searchParams.get('condition') ?? undefined,
            minPrice: searchParams.get('min_price')
                ? Number(searchParams.get('min_price'))
                : undefined,
            maxPrice: searchParams.get('max_price')
                ? Number(searchParams.get('max_price'))
                : undefined,
            search: searchParams.get('search') ?? undefined,
            sortBy: (searchParams.get('sort') as ListingFilters['sortBy']) ?? 'newest',
            page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
            limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
        }

        const { devices, total } = await getDevices(filters)

        return NextResponse.json({
            success: true,
            data: devices,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / (filters.limit ?? 20)),
            },
        })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products
// Create a new device listing — requires authentication
// Body: JSON matching CreateProductInput
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        // Get the current user from their session cookie
        // createRouteHandlerClient handles the cookie-based session for API routes
        const supabase = createServerClient(
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Parse and validate request body
        let body: CreateProductInput
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON body' },
                { status: 400 }
            )
        }

        // Basic validation — check required fields exist
        const required = ['title', 'brand_id', 'category_id', 'price', 'condition', 'images']
        const missing = required.filter(field => !body[field as keyof CreateProductInput])

        if (missing.length > 0) {
            return NextResponse.json(
                { success: false, error: `Missing required fields: ${missing.join(', ')}` },
                { status: 400 }
            )
        }

        // Create the product
        const { id } = await createProduct(user.id, body)

        return NextResponse.json(
            { success: true, data: { id } },
            { status: 201 }   // 201 Created
        )

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}