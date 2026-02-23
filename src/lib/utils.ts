import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Condition } from "@/types";

/**
 * Merge Tailwind classes safely (handles conflicts)
 * Usage: cn("px-4", isActive && "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number as a USD price string
 * formatPrice(1299) → "$1,299"
 */
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Calculate the discount percentage between original and sale price
 * getDiscount(1099, 749) → 32
 */
export function getDiscount(original: number, sale: number): number {
    return Math.round(((original - sale) / original) * 100);
}

/**
 * Map condition enum to display label and badge color
 */
export function getConditionStyle(condition: Condition): {
    label: string;
    className: string;
} {
    const map: Record<Condition, { label: string; className: string }> = {
        "like-new": { label: "Like New", className: "badge-excellent" },
        "excellent": { label: "Excellent", className: "badge-excellent" },
        "good": { label: "Good", className: "badge-good" },
        "fair": { label: "Fair", className: "badge-fair" },
    };
    return map[condition];
}

/**
 * Get battery health color based on percentage
 * 90-100 → green, 80-89 → yellow, below 80 → red
 */
export function getBatteryColor(health: number): string {
    if (health >= 90) return "text-green-600";
    if (health >= 80) return "text-yellow-600";
    return "text-red-500";
}