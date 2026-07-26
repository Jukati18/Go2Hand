// src/app/api/orders/[id]/release/route.ts
// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:id/release
//
// Called when the buyer clicks "Approve & Release Payment".
// Captures the held Stripe PaymentIntent → money moves from
// the buyer's card to Go2Hand's Stripe balance.
//
// Seller payouts happen separately (manual bank transfer or
// Stripe Connect transfers — out of scope for MVP).
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { completeOrder } from '@/services/orderWriteService'
import * as Sentry from "@sentry/nextjs";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (c) => {
                        try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
                        catch { }
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // ── Fetch order & verify buyer owns it ────────────────────
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('id, buyer_id, status, stripe_payment_intent_id')
            .eq('id', orderId)
            .single()

        if (fetchErr || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.buyer_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (order.status !== 'in_inspection') {
            return NextResponse.json(
                { error: `Cannot release payment — order status is '${order.status}'` },
                { status: 400 }
            )
        }

        // ── Capture the Stripe PaymentIntent ──────────────────────
        // This is the moment money actually moves from the card to
        // Go2Hand's Stripe account. Until now, funds were just held.
        if (order.stripe_payment_intent_id) {
            await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
            console.log('[Release] Captured PaymentIntent', order.stripe_payment_intent_id)
        } else {
            // Legacy / test orders without Stripe — allow completion anyway
            console.warn('[Release] No stripe_payment_intent_id on order', orderId)
        }

        // ── Mark order complete in DB ─────────────────────────────
        await completeOrder(orderId, user.id)

        return NextResponse.json({ success: true })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[POST /api/orders/[id]/release]', message)
        Sentry.captureException(err, { tags: { area: 'escrow_api', route: 'release' } })
        return NextResponse.json({ error: message }, { status: 500 })
    }
}