// ============================================
// Go2Hand — Core TypeScript Interfaces
// ============================================

/** Device condition grade */
export type Condition = "like-new" | "excellent" | "good" | "fair";

/** Device category */
export type Category = "smartphone" | "laptop" | "tablet" | "desktop" | "watch";

/** A device listing posted by a seller */
export interface Device {
    id: string;
    title: string;
    brand: string;
    model: string;
    category: Category;
    condition: Condition;
    price: number;
    originalPrice: number;
    images: string[];
    storage: string;
    ram?: string;
    color: string;
    batteryHealth: number; // percentage e.g. 92
    imeiStatus: "clean" | "flagged";
    carrier: string;
    isVerified: boolean;
    hasWarranty: boolean;
    sellerId: string;
    seller: Seller;
    createdAt: string;
    views: number;
    saves: number;
}

/** A seller's public profile */
export interface Seller {
    id: string;
    name: string;
    avatar: string;
    rating: number; // 0 - 5.0
    totalReviews: number;
    totalSales: number;
    isVerified: boolean;
    joinedAt: string;
}

/** A cart item */
export interface CartItem {
    device: Device;
    addedAt: string;
}

/** Checkout form data */
export interface ShippingInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
}

/** Order summary */
export interface Order {
    id: string;
    items: CartItem[];
    subtotal: number;
    shipping: number;
    insurance: number;
    tax: number;
    total: number;
    status: "pending" | "in-inspection" | "completed" | "refunded";
    createdAt: string;
}
