'use client';

// src/app/cart/page.tsx
// ─────────────────────────────────────────────────────────────────
// Shopping cart page — /cart
//
// Go2Hand is a per-device escrow marketplace, so each item has
// its own "Buy Now" → /checkout/[deviceId] flow rather than a
// single multi-item basket checkout.
//
// This page orchestrates:
//   • CartItemCard   — rich device preview per item
//   • OrderSummary   — sticky sidebar with totals + checkout CTA
//   • EmptyCartState — shown when cart is empty
//   • ToastStack     — bottom-right notification system with undo
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ShoppingCartIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart, type CartItem } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { actionAddToWatchlist } from '@/actions/watchlist';
import CartItemCard from '@/components/cart/CartItemCard';
import OrderSummary from '@/components/cart/OrderSummary';
import EmptyCartState from '@/components/cart/EmptyCartState';
import { ToastStack, useCartToasts } from '@/components/cart/CartToast';

export default function CartPage() {
    const { items, removeItem, addItem, count, subtotal } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { toasts, show: showToast, dismiss } = useCartToasts();

    // Track which items have been saved to watchlist this session
    const [movedToWatchlist, setMovedToWatchlist] = useState<Set<string>>(new Set());
    const [watchlistLoading, setWatchlistLoading] = useState<Set<string>>(new Set());

    // ── Remove with 5-second undo ─────────────────────────────────
    const handleRemove = useCallback((item: CartItem) => {
        removeItem(item.deviceId);
        showToast(
            `Removed "${item.title.slice(0, 28)}…"`,
            'info',
            () => {
                addItem({ deviceId: item.deviceId, title: item.title, price: item.price, imageUrl: item.imageUrl });
                showToast('Item restored to cart', 'ok');
            },
        );
    }, [removeItem, addItem, showToast]);

    // ── Save to watchlist (requires auth) ─────────────────────────
    const handleMoveToWatchlist = useCallback(async (item: CartItem) => {
        if (!isAuthenticated) { showToast('Sign in to save to your watchlist', 'info'); return; }
        if (movedToWatchlist.has(item.deviceId)) return;

        setWatchlistLoading(s => new Set(s).add(item.deviceId));
        const result = await actionAddToWatchlist(item.deviceId);
        setWatchlistLoading(s => { const n = new Set(s); n.delete(item.deviceId); return n; });

        if (result.success) {
            setMovedToWatchlist(s => new Set(s).add(item.deviceId));
            showToast('❤️ Saved to watchlist!', 'ok');
        } else {
            showToast(result.error ?? 'Could not save to watchlist', 'err');
        }
    }, [isAuthenticated, movedToWatchlist, showToast]);

    // ── Route to checkout (redirect guests to login first) ────────
    const handleCheckout = useCallback((deviceId: string) => {
        if (!isAuthenticated) { router.push(`/login?next=/checkout/${deviceId}`); return; }
        router.push(`/checkout/${deviceId}`);
    }, [isAuthenticated, router]);

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* Page header */}
                <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-gray-900">
                            <ShoppingCartIcon className="w-6 h-6 text-teal-700" />
                            My Cart
                            {count > 0 && (
                                <span className="text-base font-normal text-gray-400">
                                    ({count} item{count !== 1 ? 's' : ''})
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Each device is purchased separately with escrow protection
                        </p>
                    </div>
                    {count > 0 && (
                        <Link href="/devices"
                            className="flex items-center gap-1.5 text-sm font-semibold
                                text-teal-700 hover:text-teal-900 transition-colors">
                            Continue browsing <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>

                {/* Escrow notice — only when items are present */}
                {count > 0 && (
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200
                        rounded-2xl px-4 py-3.5 mb-6 animate-[fadeUp_.35s_ease_both]">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-emerald-900 mb-0.5">
                                Go2Hand Escrow Protection on every purchase
                            </p>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Your payment is held securely. Funds are only released to the seller
                                after you inspect and approve the device within 5 days of delivery.
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {count === 0 && <EmptyCartState />}

                {/* Cart content: items left + summary right */}
                {count > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 sm:gap-6 items-start">

                        {/* LEFT: device list */}
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {/* Multi-item info banner */}
                            {count > 1 && (
                                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100
                                    rounded-xl px-4 py-3 animate-[fadeDown_.3s_ease_both]">
                                    <InformationCircleIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        <span className="font-bold">Heads up:</span> Second-hand devices
                                        are unique items. Each needs its own secure checkout — click
                                        "Buy Now" on the device you want to purchase first.
                                    </p>
                                </div>
                            )}

                            {items.map((item, i) => (
                                <CartItemCard
                                    key={item.deviceId}
                                    item={item}
                                    index={i}
                                    isAuthenticated={isAuthenticated}
                                    isSavedToWatchlist={movedToWatchlist.has(item.deviceId)}
                                    isWatchlistLoading={watchlistLoading.has(item.deviceId)}
                                    onRemove={handleRemove}
                                    onMoveToWatchlist={handleMoveToWatchlist}
                                    onCheckout={handleCheckout}
                                />
                            ))}
                        </div>

                        {/* RIGHT: sticky summary */}
                        <div className="lg:sticky lg:top-[78px]">
                            <OrderSummary
                                items={items}
                                subtotal={subtotal}
                                isAuthenticated={isAuthenticated}
                                onCheckoutFirst={() => handleCheckout(items[0].deviceId)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <Footer />
            <ToastStack toasts={toasts} dismiss={dismiss} />
        </div>
    );
}