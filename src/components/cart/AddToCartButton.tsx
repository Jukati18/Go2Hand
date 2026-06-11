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
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';

interface AddToCartButtonProps {
    deviceId: string;
    title: string;
    price: number;
    imageUrl: string | null;
}

export default function AddToCartButton({
    deviceId,
    title,
    price,
    imageUrl,
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