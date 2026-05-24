// src/app/orders/[id]/page.tsx
// ============================================
// ORDER DETAIL PAGE
//
// Week 5 update: ReviewPromptCard added below
// the status tracker when order is completed
// and the current user is the buyer.
// ============================================

import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import OrderStatusTracker from '@/components/orders/OrderStatusTracker'
import ReviewPromptCard from '@/components/reviews/ReviewPromptCard'
import { getOrderById, formatOrderAmount } from '@/services/orderService'
import { getUserOrderReview } from '@/services/reviewService'

interface Props {
    params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
    const { id } = await params

    // ── Get current user session ──────────────────────────────────
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
    if (!user) redirect('/login')

    // ── Fetch order ───────────────────────────────────────────────
    const order = await getOrderById(id)
    if (!order) notFound()

    // ── Security: only buyer or seller can view this order ────────
    const isBuyer  = user.id === order.buyerId
    const isSeller = user.id === order.sellerId
    if (!isBuyer && !isSeller) notFound()

    const role            = isBuyer ? 'buyer' : 'seller'
    const product         = order.product
    const otherParty      = isBuyer ? order.seller : order.buyer
    const otherPartyLabel = isBuyer ? 'Seller' : 'Buyer'

    // ── Check if buyer already reviewed (for ReviewPromptCard) ────
    // Only needed when the order is complete and current user is buyer.
    let existingReview = null
    if (isBuyer && order.status === 'completed') {
        existingReview = await getUserOrderReview(id)
    }
    const hasReviewed = existingReview !== null

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
 
            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
 
                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-1.5 mb-5 sm:mb-6 text-[12px] text-gray-400 flex-wrap">
                    <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
                    <ChevronRightIcon className="w-3 h-3" />
                    <Link href="/dashboard/orders" className="hover:text-teal-700 transition-colors">My Orders</Link>
                    <ChevronRightIcon className="w-3 h-3" />
                    <span className="text-gray-600 font-medium font-mono">#{id.slice(0, 8).toUpperCase()}</span>
                </nav>
 
                {/* ── Page Title ── */}
                <div className="mb-5 sm:mb-6">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">Order Details</h1>
                    <p className="text-sm text-gray-400 mt-0.5 font-mono">
                        #{order.id.slice(0, 8).toUpperCase()} · Placed{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                        })}
                    </p>
                </div>
 
                {/* ── Main Grid
                    Mobile: single column (status tracker → order summary)
                    Desktop: two columns (tracker left, summary right sticky)
                ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-6 items-start">
 
                    {/* ── LEFT: Status Tracker + Review Prompt + Shipping ── */}
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <OrderStatusTracker order={order} role={role} />
                        </div>
 
                        {isBuyer && order.status === 'completed' && (
                            <ReviewPromptCard
                                hasReviewed={hasReviewed}
                                orderId={id}
                                sellerId={order.sellerId}
                                productId={order.productId}
                                productTitle={product?.title ?? 'Device'}
                                productImage={product?.images?.[0]}
                                existingRating={existingReview?.overallRating}
                            />
                        )}
 
                        {isBuyer && order.shippingAddress && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h3>
                                <div className="text-sm text-gray-600 space-y-0.5 leading-relaxed">
                                    <p className="font-semibold text-gray-800">{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.addressLine1}</p>
                                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                    <p className="text-gray-400">{order.shippingAddress.phone}</p>
                                </div>
                            </div>
                        )}
                    </div>
 
                    {/* ── RIGHT: Order Summary (sticky on desktop) ── */}
                    <div className="flex flex-col gap-4 lg:sticky lg:top-[78px]">
 
                        {/* Device summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900">Device</h3>
                            </div>
                            {product && (
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {product.images[0] ? (
                                            <Image src={product.images[0]} alt={product.title}
                                                width={64} height={64} className="w-full h-full object-contain p-1" unoptimized />
                                        ) : (
                                            <span className="text-2xl">📱</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-0.5">{product.brand}</p>
                                        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.title}</p>
                                        <Link href={`/devices/${product.id}`}
                                            className="text-xs text-teal-600 hover:text-teal-800 mt-1 inline-block transition-colors">
                                            View listing →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
 
                        {/* Price breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900">
                                    {isBuyer ? 'Payment Summary' : 'Earnings Summary'}
                                </h3>
                            </div>
                            <div className="px-5 sm:px-6 py-4 flex flex-col gap-2.5">
                                <PriceLine label="Device price" value={formatOrderAmount(order.amount)} />
                                <PriceLine label="Shipping" value={order.shippingFee === 0 ? 'Free' : formatOrderAmount(order.shippingFee)} />
                                {isSeller && (
                                    <PriceLine label="Platform fee (5%)" value={`-${formatOrderAmount(order.platformFee)}`} muted />
                                )}
                                <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">
                                        {isBuyer ? 'Total paid' : 'Your payout'}
                                    </span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {formatOrderAmount(isBuyer ? order.total : order.amount - order.platformFee)}
                                    </span>
                                </div>
                                {['paid', 'shipped', 'in_inspection'].includes(order.status) && (
                                    <div className="mt-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-xs text-emerald-700 leading-relaxed">
                                        {isBuyer
                                            ? '🔒 Your payment is held safely in escrow and will only be released once you approve the device.'
                                            : '🔒 Payment is held in escrow. It will be transferred to you once the buyer approves.'
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
 
                        {/* Other party */}
                        {otherParty && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    {otherPartyLabel}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {otherParty.username.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">{otherParty.username}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
 
            <Footer />
        </div>
    )
}

// ── Small helper ──────────────────────────────────────────────────
function PriceLine({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            <span className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
        </div>
    )
}
 
export async function generateMetadata({ params }: Props) {
    const { id } = await params
    return { title: `Order #${id.slice(0, 8).toUpperCase()} — Go2Hand` }
}