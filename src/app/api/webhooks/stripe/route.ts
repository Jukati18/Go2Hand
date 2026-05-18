// src/app/api/webhooks/stripe/route.ts
// ─────────────────────────────────────────────────────────────────
// Stripe Webhook Handler
//
// Events handled:
//  • payment_intent.succeeded   → upgrade order 'pending' → 'paid'
//  • payment_intent.canceled    → mark order 'cancelled', restore listing
//
// IMPORTANT: Stripe sends the raw request body for signature
// verification. In Next.js App Router, use request.text() to get it.
//
// Local testing:
//   stripe login
//   stripe listen --forward-to localhost:3000/api/webhooks/stripe
//   (copy the whsec_... secret into .env.local as STRIPE_WEBHOOK_SECRET)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { confirmOrderPayment } from '@/services/orderWriteService'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

// Tell Next.js not to pre-parse the body — we need the raw bytes
// for Stripe's signature verification.
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const body = await request.text() // raw body (required for HMAC verification)
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET is not set')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // ── Verify signature ─────────────────────────────────────────
    // This proves the request really came from Stripe (not a fake POST).
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

    // ── Handle events ────────────────────────────────────────────
    try {
        switch (event.type) {

            // ── Payment confirmed → upgrade pending order to paid ──
            case 'payment_intent.succeeded': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.log('[Webhook] payment_intent.succeeded', pi.id)

                // confirmOrderPayment finds the order by stripe_payment_intent_id
                // and updates status pending → paid, then marks product as sold.
                await confirmOrderPayment(pi.id)
                break
            }

            // ── Payment failed → clean up the pending order ────────
            case 'payment_intent.payment_failed': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.log('[Webhook] payment_intent.payment_failed', pi.id)

                // Mark order cancelled and reactivate the listing
                await supabase
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_payment_intent_id', pi.id)
                    .eq('status', 'pending')

                // Reactivate the product listing so someone else can buy it
                const metadata = pi.metadata as { device_id?: string }
                if (metadata.device_id) {
                    await supabase
                        .from('products')
                        .update({ status: 'active', updated_at: new Date().toISOString() })
                        .eq('id', metadata.device_id)
                }
                break
            }

            // ── PaymentIntent canceled (dispute resolved as refund) ──
            case 'payment_intent.canceled': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.log('[Webhook] payment_intent.canceled', pi.id)
                // Order is already 'refunded' — nothing extra needed here.
                break
            }

            default:
                // Unknown events are not errors — just ignore them.
                console.log('[Webhook] Unhandled event type:', event.type)
        }

        // Always return 200 so Stripe doesn't retry the event.
        return NextResponse.json({ received: true })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Webhook handler error'
        console.error('[Webhook] Handler error:', message)
        // Return 500 so Stripe retries — useful if DB is temporarily down.
        return NextResponse.json({ error: message }, { status: 500 })
    }
}