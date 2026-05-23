"use client";

// ============================================
// CART CONTEXT — src/context/CartContext.tsx
//
// Lightweight client-side cart using React Context
// + localStorage for persistence across page loads.
//
// Each cart item stores just the device ID and a
// snapshot of price + title so the cart works even
// if the device listing is edited later.
//
// Usage anywhere in the tree:
//   const { items, addItem, removeItem, clearCart, count } = useCart()
//
// The CartProvider must be rendered inside a 'use client'
// boundary.  Wire it up in layout.tsx:
//   <CartProvider>{children}</CartProvider>
// ============================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";

// ── Shape of a single cart entry ─────────────────────────────────
export interface CartItem {
    deviceId: string;
    title: string;      // snapshot — survives listing edits
    price: number;
    imageUrl: string | null;
    addedAt: string;    // ISO timestamp
}

// ── Context value surface ─────────────────────────────────────────
interface CartContextValue {
    items: CartItem[];
    count: number;                          // total number of devices in cart
    subtotal: number;                       // sum of item prices
    addItem: (item: Omit<CartItem, "addedAt">) => void;
    removeItem: (deviceId: string) => void;
    clearCart: () => void;
    isInCart: (deviceId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const LS_KEY = "go2hand_cart";

// ── Safely load cart from localStorage ───────────────────────────
function loadCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
        return [];
    }
}

// ── Safely persist cart to localStorage ──────────────────────────
function saveCart(items: CartItem[]): void {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
        // Storage blocked / quota exceeded — fail silently
    }
}

// ═════════════════════════════════════════════════════════════════
// PROVIDER
// ═════════════════════════════════════════════════════════════════
export function CartProvider({ children }: { children: ReactNode }) {
    // Initialise lazily from localStorage on first client render
    const [items, setItems] = useState<CartItem[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Hydrate from localStorage once on mount (avoids SSR mismatch)
    useEffect(() => {
        setItems(loadCart());
        setHydrated(true);
    }, []);

    // Persist whenever items change (skip the very first render)
    useEffect(() => {
        if (hydrated) saveCart(items);
    }, [items, hydrated]);

    // ── ADD ───────────────────────────────────────────────────────
    const addItem = useCallback(
        (newItem: Omit<CartItem, "addedAt">) => {
            setItems((prev) => {
                // Don't allow duplicates — each device is a unique listing
                if (prev.some((i) => i.deviceId === newItem.deviceId)) return prev;
                return [
                    ...prev,
                    { ...newItem, addedAt: new Date().toISOString() },
                ];
            });
        },
        []
    );

    // ── REMOVE ────────────────────────────────────────────────────
    const removeItem = useCallback((deviceId: string) => {
        setItems((prev) => prev.filter((i) => i.deviceId !== deviceId));
    }, []);

    // ── CLEAR ─────────────────────────────────────────────────────
    const clearCart = useCallback(() => setItems([]), []);

    // ── HELPERS ───────────────────────────────────────────────────
    const isInCart = useCallback(
        (deviceId: string) => items.some((i) => i.deviceId === deviceId),
        [items]
    );

    const count = items.length;
    const subtotal = items.reduce((sum, i) => sum + i.price, 0);

    return (
        <CartContext.Provider
            value={{ items, count, subtotal, addItem, removeItem, clearCart, isInCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

// ═════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════
export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart must be used inside <CartProvider>");
    }
    return ctx;
}