'use server'

// src/actions/adminOrders.ts
// ─────────────────────────────────────────────────────────────────
// ADMIN — ORDER MANAGEMENT ACTIONS
//
// Admins can:
//   • Force-complete an order (capture Stripe PI, mark completed)
//     → used when buyer is unresponsive past inspection window
//   • Force-refund a disputed order (cancel/refund Stripe PI)
//     → buyer-side dispute resolution
//   • Mark an order as cancelled (pre-payment stuck orders)
//
// All actions require role = 'admin'. Every write is guarded by
// a double-check that the order is actually in a valid state for
// that action — we never blindly overwrite.
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import * as Sentry from '@sentry/nextjs'

export type AdminOrderAction = 'force_complete' | 'force_refund' | 'force_cancel'

export interface AdminOrderActionPayload {
    action: AdminOrderAction
    adminNote?: string
}

// ── Build SSR client + verify admin role ──────────────────────────
async function getAdminClient() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c) => {
                    try {
                        c.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { /* Server Component context */ }
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { supabase: null, error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { supabase: null, error: 'Forbidden: admin only' }

    return { supabase, error: null }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: APPLY ADMIN ORDER ACTION
// ─────────────────────────────────────────────────────────────────
export async function actionAdminOrderAction(
    orderId: string,
    payload: AdminOrderActionPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminClient()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const now = new Date().toISOString()

        // Fetch the order first so we can validate state transitions
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('id, status, stripe_payment_intent_id, product_id, buyer_id, seller_id')
            .eq('id', orderId)
            .single()

        if (fetchErr || !order) return { success: false, error: 'Order not found' }

        switch (payload.action) {

            // ── FORCE COMPLETE ────────────────────────────────────
            // Captures the Stripe hold and marks order completed.
            // Valid only for: paid, shipped, in_inspection
            case 'force_complete': {
                const validStatuses = ['paid', 'shipped', 'in_inspection']
                if (!validStatuses.includes(order.status)) {
                    return {
                        success: false,
                        error: `Cannot force-complete — order is '${order.status}'. Must be in: ${validStatuses.join(', ')}`,
                    }
                }

                // Capture the Stripe PaymentIntent
                if (order.stripe_payment_intent_id) {
                    try {
                        const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
                        if (pi.status === 'requires_capture') {
                            await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
                        }
                        // If already captured (succeeded) — no action needed, just update DB
                    } catch (stripeErr) {
                        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
                        // Don't block if already captured
                        if (!msg.includes('already been captured')) {
                            Sentry.captureException(stripeErr, {
                                tags: { action: 'admin_force_complete' },
                                extra: { orderId, intentId: order.stripe_payment_intent_id }
                            })
                            return { success: false, error: `Stripe error: ${msg}` }
                        }
                    }
                }

                const { error: updateErr } = await supabase
                    .from('orders')
                    .update({
                        status: 'completed',
                        completed_at: now,
                        updated_at: now,
                    })
                    .eq('id', orderId)

                if (updateErr) throw new Error(updateErr.message)
                break
            }

            // ── FORCE REFUND ──────────────────────────────────────
            // Cancels/refunds the Stripe hold, marks order refunded.
            // Valid for: disputed, in_inspection, paid, shipped
            case 'force_refund': {
                const validStatuses = ['disputed', 'in_inspection', 'paid', 'shipped']
                if (!validStatuses.includes(order.status)) {
                    return {
                        success: false,
                        error: `Cannot refund — order is '${order.status}'`,
                    }
                }

                if (order.stripe_payment_intent_id) {
                    try {
                        const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)

                        if (pi.status === 'requires_capture') {
                            // Funds held but not yet captured — cancel the hold (no charge ever moves)
                            await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
                        } else if (pi.status === 'succeeded') {
                            // Already captured — issue a real refund
                            await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })
                        }
                        // Any other status (cancelled, etc.) — nothing to do on Stripe side
                    } catch (stripeErr) {
                        console.error('[adminOrders] Stripe refund error:', stripeErr)
                        Sentry.captureException(stripeErr, {
                            tags: { action: 'admin_force_refund' },
                            extra: { orderId, intentId: order.stripe_payment_intent_id }
                        })
                        // Log but don't block DB update — admin should verify in Stripe dashboard
                    }
                }

                const { error: updateErr } = await supabase
                    .from('orders')
                    .update({
                        status: 'refunded',
                        refunded_at: now,
                        updated_at: now,
                    })
                    .eq('id', orderId)

                if (updateErr) throw new Error(updateErr.message)

                // Re-activate the product listing so it can be re-sold
                await supabase
                    .from('products')
                    .update({ status: 'active', updated_at: now })
                    .eq('id', order.product_id)

                break
            }

            // ── FORCE CANCEL ──────────────────────────────────────
            // Cancels the Stripe hold (if any) and marks order cancelled.
            // Valid for: pending, paid
            case 'force_cancel': {
                const validStatuses = ['pending', 'paid']
                if (!validStatuses.includes(order.status)) {
                    return {
                        success: false,
                        error: `Cannot cancel — order is '${order.status}'. Can only cancel pending or paid orders.`,
                    }
                }

                if (order.stripe_payment_intent_id && order.status === 'paid') {
                    try {
                        await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
                    } catch (stripeErr) {
                        console.error('[adminOrders] Stripe cancel error:', stripeErr)
                        Sentry.captureException(stripeErr, {
                            tags: { action: 'admin_force_cancel' },
                            extra: { orderId, intentId: order.stripe_payment_intent_id }
                        })
                    }
                }

                const { error: updateErr } = await supabase
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        cancelled_at: now,
                        updated_at: now,
                    })
                    .eq('id', orderId)

                if (updateErr) throw new Error(updateErr.message)

                // Re-activate the product listing
                await supabase
                    .from('products')
                    .update({ status: 'active', updated_at: now })
                    .eq('id', order.product_id)

                break
            }

            default:
                return { success: false, error: 'Unknown action' }
        }

        // Revalidate all affected pages
        revalidatePath('/admin/orders')
        revalidatePath('/admin')
        revalidatePath(`/orders/${orderId}`)

        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        console.error('[adminOrders] action error:', msg)
        Sentry.captureException(err, {
            tags: { action: 'admin_order_action_global' },
            extra: { orderId, payload }
        })
        return { success: false, error: msg }
    }
}