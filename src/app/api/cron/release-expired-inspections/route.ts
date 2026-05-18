// src/app/api/cron/release-expired-inspections/route.ts
// ─────────────────────────────────────────────────────────────────
// AUTO-RELEASE CRON JOB
//
// What it does:
//   Every hour, Vercel calls this endpoint.
//   It finds all orders where:
//     • status = 'in_inspection'
//     • inspection_started_at + 5 days <= NOW()
//   For each expired order it:
//     1. Calls stripe.paymentIntents.capture() → money moves to Go2Hand
//     2. Updates order status to 'completed' with completed_at timestamp
//
// Why this matters:
//   Buyers have 5 days to approve or dispute. If they forget (very
//   common), the payment would be stuck in limbo forever without this.
//   Auto-release protects sellers from buyers who ghost after receiving.
//
// Security:
//   Vercel automatically sends an Authorization: Bearer {CRON_SECRET}
//   header with every cron request. We verify it to prevent anyone
//   else from triggering releases by calling this URL manually.
//
// Setup:
//   1. Add CRON_SECRET to your Vercel environment variables
//      (any random string, e.g. `openssl rand -hex 32`)
//   2. Add the cron schedule to vercel.json (see bottom of this file)
//   3. In local dev, call manually:
//      curl -H "Authorization: Bearer your_secret" \
//           http://localhost:3000/api/cron/release-expired-inspections
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabaseClient'

// Force dynamic so Next.js never statically renders this route
export const dynamic = 'force-dynamic'

// ── How long the buyer has to inspect before auto-release ─────────
const INSPECTION_DAYS = 5

export async function GET(request: NextRequest) {

    // ── 1. Verify the request came from Vercel cron ───────────────
    // Without this check, anyone could hit this URL and trigger
    // payment captures for all expired orders.
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken) {
        console.error('[Cron] CRON_SECRET env var is not set')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
        console.warn('[Cron] Unauthorized cron attempt')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Calculate the expiry cutoff timestamp ──────────────────
    // Any order where inspection started more than 5 days ago is expired.
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - INSPECTION_DAYS)
    const cutoffISO = cutoff.toISOString()

    console.log(`[Cron] Checking for inspections that started before ${cutoffISO}`)

    // ── 3. Fetch all expired inspection orders ────────────────────
    const { data: expiredOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id, stripe_payment_intent_id, buyer_id, seller_id, product_id, inspection_started_at')
        .eq('status', 'in_inspection')
        .lt('inspection_started_at', cutoffISO) // started more than 5 days ago

    if (fetchError) {
        console.error('[Cron] Failed to fetch expired orders:', fetchError.message)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!expiredOrders || expiredOrders.length === 0) {
        console.log('[Cron] No expired inspections found')
        return NextResponse.json({ released: 0, message: 'No expired inspections' })
    }

    console.log(`[Cron] Found ${expiredOrders.length} expired inspection(s)`)

    // ── 4. Process each expired order ─────────────────────────────
    // Use Promise.allSettled so one failure doesn't block the others.
    // Each order is independent — if Stripe fails for order A, we
    // still want to process orders B, C, D.
    const now = new Date().toISOString()

    const results = await Promise.allSettled(
        expiredOrders.map(async (order) => {

            // ── 4a. Capture the Stripe PaymentIntent ─────────────
            // This is the moment money actually moves from the buyer's
            // held authorization to Go2Hand's Stripe balance.
            if (order.stripe_payment_intent_id) {
                try {
                    await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
                    console.log(`[Cron] Captured PI ${order.stripe_payment_intent_id} for order ${order.id}`)
                } catch (stripeErr: unknown) {
                    // If Stripe throws "No such payment_intent" or the PI was
                    // already captured / cancelled, log and continue to DB update.
                    const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)

                    // PI already captured = still a success, update DB
                    if (!msg.includes('already been captured')) {
                        console.error(`[Cron] Stripe capture failed for order ${order.id}:`, msg)
                        // Re-throw so this order is counted as failed
                        throw new Error(`Stripe capture failed: ${msg}`)
                    }

                    console.warn(`[Cron] PI ${order.stripe_payment_intent_id} was already captured`)
                }
            } else {
                // Test/legacy order without Stripe — still auto-complete it
                console.warn(`[Cron] Order ${order.id} has no stripe_payment_intent_id, completing anyway`)
            }

            // ── 4b. Mark order completed in DB ───────────────────
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    completed_at: now,
                    updated_at: now,
                })
                .eq('id', order.id)
                .eq('status', 'in_inspection') // double-check status hasn't changed

            if (updateError) {
                throw new Error(`DB update failed: ${updateError.message}`)
            }

            console.log(`[Cron] Auto-completed order ${order.id} (inspection expired)`)
            return order.id
        })
    )

    // ── 5. Summarize results ──────────────────────────────────────
    const succeeded = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value)

    const failed = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message ?? 'Unknown error')

    console.log(`[Cron] Done. Released: ${succeeded.length}, Failed: ${failed.length}`)

    return NextResponse.json({
        released: succeeded.length,
        failed: failed.length,
        // Include order IDs in response for easy Vercel log debugging
        releasedOrderIds: succeeded,
        errors: failed.length > 0 ? failed : undefined,
    })
}