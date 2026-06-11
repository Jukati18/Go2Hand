'use client';

// src/components/cart/OrderSummary.tsx
// ─────────────────────────────────────────────────────────────────
// Sticky sidebar showing per-item price breakdown and checkout CTA.
// Since Go2Hand uses per-device escrow, the primary CTA checks out
// only the first item (with an explanation for multi-item carts).
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheckIcon, TruckIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { CartItem } from '@/context/CartContext';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n);
}

function SummaryLine({ label, value, muted = false, highlight = false }: {
    label: string; value: string; muted?: boolean; highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            <span className={`text-sm font-medium ${
                highlight ? 'text-emerald-600 font-semibold' :
                muted ? 'text-gray-400' : 'text-gray-800'
            }`}>{value}</span>
        </div>
    );
}

interface OrderSummaryProps {
    items: CartItem[];
    subtotal: number;
    isAuthenticated: boolean;
    onCheckoutFirst: () => void;
}

export default function OrderSummary({
    items, subtotal, isAuthenticated, onCheckoutFirst,
}: OrderSummaryProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Order Summary</h2>
            </div>

            {/* Per-item breakdown */}
            <div className="px-5 sm:px-6 py-4 flex flex-col gap-3 border-b border-gray-100">
                {items.map(item => (
                    <div key={item.deviceId} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100
                            flex items-center justify-center shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.title}
                                    width={40} height={40}
                                    className="w-full h-full object-contain p-0.5" unoptimized />
                            ) : <span className="text-base">📱</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-1">
                                {item.title}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Qty: 1 (unique listing)</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0">
                            {fmt(item.price)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Price breakdown */}
            <div className="px-5 sm:px-6 py-4 flex flex-col gap-2.5">
                <SummaryLine label="Subtotal" value={fmt(subtotal)} />
                <SummaryLine label="Shipping" value="Free" highlight />
                <SummaryLine label="Platform fee" value="$0" muted />
                <SummaryLine label="Tax" value="Calculated at checkout" muted />

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                        {items.length > 1 ? 'Cart total' : 'Total'}
                    </span>
                    <span className="text-xl font-bold text-gray-900">{fmt(subtotal)}</span>
                </div>

                {items.length > 1 && (
                    <p className="text-[11px] text-gray-400 leading-relaxed bg-gray-50
                        rounded-lg px-3 py-2 border border-gray-100">
                        Each device requires its own checkout. The total above shows
                        the combined value of all items.
                    </p>
                )}
            </div>

            {/* CTAs */}
            <div className="px-5 sm:px-6 pb-5 flex flex-col gap-2">
                <button
                    onClick={onCheckoutFirst}
                    className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                        rounded-xl flex items-center justify-center gap-2 text-sm
                        transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                    <ShieldCheckIcon className="w-4 h-4" />
                    {items.length > 1
                        ? `Checkout first item — ${fmt(items[0].price)}`
                        : `Secure Checkout — ${fmt(subtotal)}`}
                </button>

                {!isAuthenticated && (
                    <Link href="/login?next=/cart"
                        className="w-full h-10 border-2 border-teal-800 text-teal-800
                            font-semibold rounded-xl flex items-center justify-center gap-1.5
                            text-sm hover:bg-teal-50 transition-colors">
                        Sign in to checkout
                    </Link>
                )}

                <div className="flex items-start gap-2 mt-1">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        Payment held in escrow. Released only after you approve the device.
                    </p>
                </div>
            </div>

            {/* Trust badges */}
            <div className="border-t border-gray-100 px-5 sm:px-6 py-4 flex flex-col gap-2.5">
                {[
                    { icon: ShieldCheckIcon, text: 'Escrow — money held until you approve' },
                    { icon: TruckIcon,       text: 'Free shipping on all devices'          },
                    { icon: ArrowPathIcon,   text: '30-day hassle-free returns'            },
                    { icon: CheckCircleIcon, text: 'IMEI verified — not stolen/blacklisted'},
                ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-gray-500">
                        <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                        {text}
                    </div>
                ))}
            </div>
        </div>
    );
}