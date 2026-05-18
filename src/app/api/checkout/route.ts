// src/app/api/checkout/route.ts
// ─────────────────────────────────────────────────────────────────
// POST /api/checkout
//
// What this does:
//  1. Validates the device is still available
//  2. Creates a Stripe PaymentIntent with capture_method:'manual'
//     → Stripe authorises (holds) the funds but does NOT charge yet
//  3. Creates an Order in the DB with status:'pending'
//     → Webhook upgrades it to 'paid' once Stripe confirms
//  4. Returns { clientSecret, orderId } to the client
//
// capture_method:'manual' is the escrow mechanism:
//  - Funds are ring-fenced on the buyer's card
//  - We capture (charge) only when the buyer approves the device
//  - We cancel the intent (no charge) on dispute/refund
//  - ⚠️ Stripe enforces a 7-day capture window — ensure total
//    shipping + inspection time stays under 7 days for MVP.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { getDeviceById } from '@/services/deviceService'
import { createOrder } from '@/services/orderWriteService'
import type { ShippingAddress } from '@/types/order'

export async function POST(request: NextRequest) {
    try {
        // ── 1. Auth ───────────────────────────────────────────────
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

        // ── 2. Parse body ─────────────────────────────────────────
        const body: { deviceId: string; shippingAddress: ShippingAddress; shippingFee?: number } =
            await request.json()

        const { deviceId, shippingAddress, shippingFee = 0 } = body

        if (!deviceId || !shippingAddress) {
            return NextResponse.json({ error: 'deviceId and shippingAddress are required' }, { status: 400 })
        }

        // ── 3. Validate device ────────────────────────────────────
        const device = await getDeviceById(deviceId)
        if (!device) {
            return NextResponse.json({ error: 'Device not found or already sold' }, { status: 404 })
        }

        if (device.seller.id === user.id) {
            return NextResponse.json({ error: 'You cannot purchase your own listing' }, { status: 400 })
        }

        // ── 4. Create Stripe PaymentIntent (escrow hold) ──────────
        const amountCents = Math.round(device.price * 100)
        const shippingCents = Math.round(shippingFee * 100)
        const totalCents = amountCents + shippingCents

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',

            // KEY: hold the funds without charging — we capture manually
            // when the buyer approves the device after inspection.
            capture_method: 'manual',

            // Allow the most common payment methods automatically
            automatic_payment_methods: { enabled: true },

            // Store context in Stripe for webhook processing
            metadata: {
                device_id: deviceId,
                seller_id: device.seller.id,
                buyer_id: user.id,
                device_title: device.fullName.slice(0, 255),
            },

            description: `Go2Hand escrow — ${device.fullName}`,
        })

        // ── 5. Create pending order in DB ─────────────────────────
        // Status is 'pending' until webhook confirms Stripe payment.
        // Product is NOT marked sold yet — happens in the webhook.
        const { id: orderId } = await createOrder(user.id, {
            productId: deviceId,
            sellerId: device.seller.id,
            amount: device.price,
            shippingFee,
            shippingAddress,
            stripePaymentIntentId: paymentIntent.id,
            initialStatus: 'pending', // ← upgraded to 'paid' by webhook
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            orderId,
            amount: device.price,
            shippingFee,
            total: device.price + shippingFee,
        })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[POST /api/checkout]', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}