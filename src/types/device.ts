// ============================================
// TYPES — Go2Hand Device Marketplace
// ============================================

export type DeviceCondition = 'A+' | 'A' | 'B' | 'C';
export type ConditionLabel = 'Excellent' | 'Good' | 'Fair';
export type CheckStatus = 'ok' | 'warn' | 'bad';

export interface ConditionCheck {
    label: string;
    status: CheckStatus;
}

export interface DeviceSpec {
    label: string;
    value: string;
    highlighted?: boolean; // e.g. "Clean — Not Blacklisted"
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

export interface Review {
    id: string;
    reviewerName: string;
    reviewerInitials: string;
    avatarColor: string;
    rating: number;
    date: string;
    text: string;
}

export interface Device {
    id: string;
    brand: string;
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
}