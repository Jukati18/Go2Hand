// src/app/api/webhooks/stripe/route.ts
// ─────────────────────────────────────────────────────────────────
// Stripe Webhook Handler
//
// Events handled:
//  • payment_intent.succeeded        → order 'pending' → 'paid'
//  • payment_intent.payment_failed   → order → 'cancelled', listing restored
//  • payment_intent.canceled         → handles both intentional cancels AND
//                                      Stripe's 7-day auto-cancel (edge case)
//  • payment_intent.amount_capturable_updated → logged only
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { confirmOrderPayment } from '@/services/orderWriteService'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not set')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid signature'
        console.error('[Webhook] Signature verification failed:', msg)
        return NextResponse.json({ error: msg }, { status: 400 })
    }

    try {
        switch (event.type) {

            // ── Payment held → upgrade pending order to 'paid' ────
            case 'payment_intent.succeeded': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.log('[Webhook] payment_intent.succeeded', pi.id)
                await confirmOrderPayment(pi.id)
                break
            }

            // ── Payment failed → cancel order, restore listing ────
            case 'payment_intent.payment_failed': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.log('[Webhook] payment_intent.payment_failed', pi.id)

                await supabase
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_payment_intent_id', pi.id)
                    .eq('status', 'pending')

                const meta = pi.metadata as { device_id?: string }
                if (meta.device_id) {
                    await supabase
                        .from('products')
                        .update({ status: 'active', updated_at: new Date().toISOString() })
                        .eq('id', meta.device_id)
                }
                break
            }

            // ── PaymentIntent cancelled ───────────────────────────
            // Two scenarios:
            //   A) We cancelled intentionally (dispute/refund/buyer cancel)
            //      → order is already 'cancelled' or 'refunded' → do nothing
            //   B) Stripe auto-cancelled (7-day capture window expired)
            //      → order is still 'in_inspection' or 'paid' → mark refunded
            case 'payment_intent.canceled': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.log('[Webhook] payment_intent.canceled', pi.id)

                // Only act if order is still in an active state (scenario B)
                const { data: order } = await supabase
                    .from('orders')
                    .select('id, product_id, status')
                    .eq('stripe_payment_intent_id', pi.id)
                    .in('status', ['paid', 'shipped', 'in_inspection'])
                    .maybeSingle()

                if (order) {
                    // Stripe auto-cancelled — buyer gets money back automatically
                    const now = new Date().toISOString()
                    console.warn(
                        `[Webhook] Stripe auto-cancelled PI for order ${order.id}`,
                        `(was '${order.status}') — 7-day window likely expired`
                    )

                    await supabase
                        .from('orders')
                        .update({ status: 'refunded', refunded_at: now, updated_at: now })
                        .eq('id', order.id)

                    // Restore the listing so it can be sold again
                    await supabase
                        .from('products')
                        .update({ status: 'active', updated_at: now })
                        .eq('id', order.product_id)
                }
                break
            }

            default:
                console.log('[Webhook] Unhandled event type:', event.type)
        }

        return NextResponse.json({ received: true })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Webhook handler error'
        console.error('[Webhook] Handler error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}