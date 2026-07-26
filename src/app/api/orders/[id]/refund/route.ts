// src/app/api/orders/[id]/refund/route.ts
// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:id/refund  (admin only)
//
// Called when admin resolves a dispute in the buyer's favour.
// Since disputes only happen during 'in_inspection' (before we
// capture the PaymentIntent), we CANCEL the hold — no charge
// ever moves. The buyer's card is un-held automatically.
//
// If the order was somehow already captured, we create a Stripe
// Refund instead.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { refundOrder } from '@/services/orderWriteService'
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

        // ── Verify admin role ─────────────────────────────────────
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // ── Fetch order ───────────────────────────────────────────
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('id, status, stripe_payment_intent_id, product_id')
            .eq('id', orderId)
            .single()

        if (fetchErr || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.status !== 'disputed') {
            return NextResponse.json(
                { error: `Cannot refund — order status is '${order.status}'` },
                { status: 400 }
            )
        }

        // ── Stripe: cancel hold or create refund ──────────────────
        if (order.stripe_payment_intent_id) {
            try {
                const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)

                if (pi.status === 'requires_capture') {
                    // Funds are held but NOT yet captured → cancel to release hold.
                    // Buyer's card is un-held, no money ever moved.
                    await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
                    console.log('[Refund] Cancelled (uncaptured) PaymentIntent', pi.id)
                } else if (pi.status === 'succeeded') {
                    // Funds were already captured (edge case) → issue a proper refund.
                    await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })
                    console.log('[Refund] Created Stripe Refund for captured PI', pi.id)
                } else {
                    console.warn('[Refund] PaymentIntent in unexpected status:', pi.status)
                }
            } catch (stripeErr) {
                // If Stripe fails, log but don't block the DB update.
                // Admin should manually check the Stripe dashboard.
                console.error('[Refund] Stripe error:', stripeErr)
            }
        }

        // ── Update order status in DB ─────────────────────────────
        await refundOrder(orderId)

        // Reactivate the product listing (can be re-sold)
        await supabase
            .from('products')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', order.product_id)

        return NextResponse.json({ success: true })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[POST /api/orders/[id]/refund]', message)
        Sentry.captureException(err, { tags: { area: 'escrow_api', route: 'refund'} })
        return NextResponse.json({ error: message }, { status: 500 })
    }
}