// ============================================
// DEVICE INPUT TYPES — input / mutation shapes
// These are used for CREATE and UPDATE forms.
// The read-side Device type lives in device.ts
//
// Note: Supabase stores condition as snake_case strings
// (like_new, excellent…), which differ from the display
// grade (A+, A, B, C) shown in the UI — see device.ts.
// ============================================

/** Condition values stored in the Supabase `products` table */
export type ListingCondition = 'like_new' | 'excellent' | 'good' | 'fair'

/** Listing lifecycle status */
export type ListingStatus = 'active' | 'inactive' | 'sold' | 'pending_review'

/** IMEI / iCloud / Carrier lock status */
export type LockStatus = 'clean' | 'flagged' | 'unlocked' | 'locked'

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — everything a seller fills in when listing a device
// ─────────────────────────────────────────────────────────────────────────────
export interface CreateDeviceInput {
    // Core identity
    title: string               // e.g. "Apple iPhone 13 Pro 256GB"
    brand_id: string            // FK → brands.id
    category_id: string         // FK → categories.id
    device_model_id?: string    // FK → device_models.id (optional if model unknown)

    // Pricing
    price: number               // asking price (USD)
    original_price: number      // retail price for discount badge

    // Physical state
    condition: ListingCondition
    color: string
    storage_capacity: string    // e.g. "256GB"
    battery_health: number      // 0-100 percentage

    // Images — array of public URLs from Supabase Storage upload
    // Upload images first via storageService.ts, then pass URLs here
    images: string[]            // min 1, recommended 5+

    // Lock / verification status
    imei_status: 'clean' | 'flagged'
    icloud_status: 'unlocked' | 'locked'
    carrier_status: 'unlocked' | 'locked'

    // Free-form technical specs stored as JSON
    // e.g. { ram: "6GB", display: "6.1-inch OLED", chip: "A15 Bionic" }
    specs?: Record<string, string>

    // Optional seller notes shown on detail page
    description?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — partial edit; seller can change price, status, images, description
// ─────────────────────────────────────────────────────────────────────────────
export interface UpdateDeviceInput {
    title?: string
    price?: number
    original_price?: number
    condition?: ListingCondition
    color?: string
    storage_capacity?: string
    battery_health?: number
    images?: string[]
    imei_status?: 'clean' | 'flagged'
    icloud_status?: 'unlocked' | 'locked'
    carrier_status?: 'unlocked' | 'locked'
    specs?: Record<string, string>
    description?: string
    status?: ListingStatus      // mark as inactive / sold
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE WRAPPER — standard shape for all API routes
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST — one entry in the user's saved devices list
// ─────────────────────────────────────────────────────────────────────────────
export interface WatchlistEntry {
    id: string
    user_id: string
    device_id: string   // references products.id in Supabase
    created_at: string
}