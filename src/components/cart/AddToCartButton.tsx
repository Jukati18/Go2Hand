'use client';

// src/components/cart/AddToCartButton.tsx
// ─────────────────────────────────────────────────────────────────
// Add to Cart button for the device detail page.
//
// States:
//   idle       → "Add to Cart"  (green button)
//   in_cart    → "Added ✓" + "Go to Cart" link  (teal)
//   adding     → brief pulse animation on click
//
// Uses CartContext so the Navbar badge updates instantly.
//
// GA4: fires add_to_cart the moment the item is actually added
// (not on every click — showAdded guards against double-firing
// when the button is clicked again while already in the cart).
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { trackAddToCart } from '@/lib/analytics';

interface AddToCartButtonProps {
    deviceId: string;
    title: string;
    price: number;
    imageUrl: string | null;
    /** Optional — improves GA4 item data when the parent has it (device detail page) */
    brand?: string;
    category?: string;
}

export default function AddToCartButton({
    deviceId,
    title,
    price,
    imageUrl,
    brand,
    category,
}: AddToCartButtonProps) {
    const { addItem, isInCart } = useCart();
    const [justAdded, setJustAdded] = useState(false);

    // Sync with cart state on mount (e.g. user navigated back)
    const alreadyInCart = isInCart(deviceId);
    const showAdded = alreadyInCart || justAdded;

    function handleAdd() {
        if (showAdded) return;
        addItem({ deviceId, title, price, imageUrl });
        setJustAdded(true);

        // ── GA4: add_to_cart ────────────────────────────────────
        trackAddToCart({
            item_id: deviceId,
            item_name: title,
            item_brand: brand,
            item_category: category,
            price,
            quantity: 1,
        });
    }

    // Reset justAdded if item is removed from cart externally
    useEffect(() => {
        if (!alreadyInCart) setJustAdded(false);
    }, [alreadyInCart]);

    if (showAdded) {
        return (
            <div className="flex flex-col gap-2">
                {/* Success state */}
                <div className="w-full h-[50px] sm:h-[52px] bg-emerald-50 border-2 border-emerald-400
                    rounded-xl flex items-center justify-center gap-2 text-emerald-700
                    font-bold text-[15px] animate-[fadeUp_.25s_ease_both]">
                    <CheckCircleIcon className="w-5 h-5" />
                    Added to Cart!
                </div>
                {/* Go to cart CTA */}
                <Link
                    href="/cart"
                    className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                        rounded-xl flex items-center justify-center gap-2 text-[15px]
                        transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <ShoppingCartIcon className="w-4 h-4" />
                    Go to Cart
                </Link>
            </div>
        );
    }

    return (
        <button
            onClick={handleAdd}
            className="w-full h-[50px] sm:h-[52px] bg-teal-800 hover:bg-teal-700
                text-white font-bold rounded-xl flex items-center justify-center gap-2
                text-[15px] transition-all hover:-translate-y-0.5 hover:shadow-lg
                active:scale-95"
        >
            <ShoppingCartIcon className="w-4 h-4" />
            Add to Cart — ${price}
        </button>
    );
}