// src/types/device.ts
// ============================================
// TYPES — Go2Hand Device Marketplace
//
// Week 5 update: Review interface extended with
// overallRating, sellerRating, accuracyRating, title
// to match the DisplayReview shape from review.ts.
// ============================================

export type DeviceCondition = 'A+' | 'A' | 'B' | 'C';
export type ConditionLabel  = 'Excellent' | 'Good' | 'Fair';
export type CheckStatus     = 'ok' | 'warn' | 'bad';

export interface ConditionCheck {
    label: string;
    status: CheckStatus;
}

export interface DeviceSpec {
    label: string;
    value: string;
    highlighted?: boolean;
}

export interface Seller {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    isVerified: boolean;
    memberSince: string;
    location: string;
    rating: number;
    totalSales: number;
    responseTime: string;
}

// ─────────────────────────────────────────────────────────────────
// REVIEW — matches DisplayReview from review.ts
//
// Three rating dimensions:
//  • overallRating  — headline experience (1–5)
//  • sellerRating   — communication, honesty, speed (1–5)
//  • accuracyRating — did device match listing? (1–5)
// ─────────────────────────────────────────────────────────────────
export interface Review {
    id: string;
    reviewerName: string;
    reviewerInitials: string;
    avatarColor: string;
    /** Headline overall rating (1–5) */
    overallRating: number;
    /** Seller communication/honesty/speed (1–5) */
    sellerRating: number;
    /** Device accuracy vs listing (1–5) */
    accuracyRating: number;
    /** Optional bold title line */
    title: string;
    /** Full review body text */
    text: string;
    /** Formatted date string e.g. "May 12, 2025" */
    date: string;
}

export interface Device {
    id: string;
    brand: string;
    /**
     * URL slug for the brand (e.g. "apple", "samsung").
     * Used to build breadcrumb links: /categories/[categorySlug]/[brandSlug]
     */
    brandSlug: string;
    model: string;
    fullName: string;
    storage: string;
    color: string;
    grade: DeviceCondition;
    conditionLabel: ConditionLabel;
    price: number;
    originalPrice: number;
    images: string[];
    isVerified: boolean;
    inspectedDate: string;
    batteryHealth: number;
    conditionChecks: ConditionCheck[];
    specs: DeviceSpec[];
    seller: Seller;
    reviews: Review[];
    totalReviews: number;
    averageRating: number;
    shippingProvider: string;
    shippingDays: string;
    imeiStatus: 'clean' | 'flagged';
    iCloudStatus: 'unlocked' | 'locked';
    carrierStatus: 'unlocked' | 'locked';
    availableStorage: string[];
    storagePrices: Record<string, number>;
    category: string;
    /**
     * URL slug for the category (e.g. "smartphones", "laptops").
     * Used to build breadcrumb links: /categories/[categorySlug]
     */
    categorySlug: string;
}