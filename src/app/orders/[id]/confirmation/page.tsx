// src/app/orders/[id]/confirmation/page.tsx
// ─────────────────────────────────────────────────────────────────
// ORDER CONFIRMATION PAGE — /orders/[id]/confirmation
//
// Shown after successful checkout. Rich alternative to the basic
// /checkout/success page — loads full order data and provides:
//   • Animated success state on first render
//   • Full order + device + seller details
//   • Live inspection countdown (when in_inspection status)
//   • Adaptive "what happens next" steps per escrow status
//   • Buyer action buttons (approve / dispute)
//   • Auto-refresh polling to catch webhook status upgrades
//
// Accessible from:
//   • /checkout/success redirect: ?order_id=xxx → /orders/xxx/confirmation
//   • Direct link from order history
// ─────────────────────────────────────────────────────────────────

import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getOrderById } from '@/services/orderService'
import OrderConfirmationClient from '@/components/orders/OrderConfirmationClient'

interface Props {
    params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: Props) {
    const { id } = await params

    // ── Auth guard ─────────────────────────────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {},
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/login?next=/orders/${id}/confirmation`)

    // ── Fetch order ────────────────────────────────────────────────
    const order = await getOrderById(id)
    if (!order) notFound()

    // ── Security: only buyer or seller can view ────────────────────
    const isBuyer  = user.id === order.buyerId
    const isSeller = user.id === order.sellerId
    if (!isBuyer && !isSeller) notFound()

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <OrderConfirmationClient
                order={order}
                role={isBuyer ? 'buyer' : 'seller'}
                userId={user.id}
            />
            <Footer />
        </div>
    )
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    return {
        title: `Order Confirmed #${id.slice(0, 8).toUpperCase()} — Go2Hand`,
        description: 'Your purchase is protected by Go2Hand escrow.',
    }
}