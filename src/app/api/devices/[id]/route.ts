// ============================================
// /api/devices/[id] — Single Device REST API
//
// GET    /api/devices/:id  → fetch one device (public)
// PUT    /api/devices/:id  → update listing   (seller only)
// DELETE /api/devices/:id  → remove listing   (seller only)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDeviceById } from '@/services/deviceService'
import { updateDevice, deleteDevice } from '@/services/deviceWriteService'
import type { UpdateDeviceInput } from '@/types/deviceInput'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/devices/:id
// Public — no auth required. Returns full device detail.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // Next.js 15+ requires params to be a Promise
) {
    try {
        const { id } = await params

        const device = await getDeviceById(id)

        if (!device) {
            return NextResponse.json(
                { success: false, error: 'Device not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: device })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/devices/:id
// Update a listing — only the seller who owns it can update.
// Body: Partial<UpdateDeviceInput> (only send fields you want to change)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const cookieStore = await cookies()

        // Initialize Supabase client using @supabase/ssr
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
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch {
                            // Ignore in edge cases where cookies cannot be set
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

        let body: UpdateDeviceInput
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON body' },
                { status: 400 }
            )
        }

        // deviceWriteService.updateDevice enforces seller_id match via Supabase RLS.
        // If the user doesn't own this device, the update silently affects 0 rows.
        await updateDevice(id, user.id, body)

        return NextResponse.json({ success: true })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'

        // If RLS blocks it, Supabase throws a permission error — surface as 403
        const status = message.includes('permission') || message.includes('RLS') ? 403 : 500

        return NextResponse.json(
            { success: false, error: message },
            { status }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/devices/:id
// Soft-delete (sets status = 'inactive') — seller only
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const cookieStore = await cookies()

        // Initialize Supabase client using @supabase/ssr
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
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch {
                            // Ignore in edge cases where cookies cannot be set
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

        await deleteDevice(id, user.id)

        return NextResponse.json({ success: true })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}