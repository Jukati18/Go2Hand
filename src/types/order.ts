// ============================================
// ORDER TYPES — Go2Hand Escrow Order System
//
// The escrow flow:
//   pending → paid → shipped → in_inspection → completed
//                                             → disputed → refunded
//   Any stage before "shipped" → cancelled
// ============================================

/** All possible states an order can be in */
export type OrderStatus =
    | 'pending'        // Order created, buyer hasn't paid yet
    | 'paid'           // Money received and HELD in escrow (not released to seller yet)
    | 'shipped'        // Seller marked as shipped, tracking number added
    | 'in_inspection'  // Buyer received device, 5-day inspection window active
    | 'completed'      // Buyer approved → escrow releases money to seller 🎉
    | 'disputed'       // Buyer raised an issue during inspection
    | 'refunded'       // Money returned to buyer (after dispute resolution)
    | 'cancelled'      // Cancelled before payment

/** Snapshot of buyer's shipping address at time of purchase */
export interface ShippingAddress {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
}

/** A single order with full escrow tracking */
export interface Order {
    id: string
    buyerId: string
    sellerId: string
    productId: string

    // ── Price snapshot (frozen at purchase time) ──────────────────
    // These never change — even if the seller edits the listing later
    amount: number          // device price
    shippingFee: number     // shipping cost
    platformFee: number     // Go2Hand's 5% fee (deducted from seller payout)
    total: number           // amount + shippingFee (buyer pays this)

    // ── Escrow status ─────────────────────────────────────────────
    status: OrderStatus

    // ── Status timestamps (null = not reached yet) ────────────────
    paidAt: string | null           // when escrow received the money
    shippedAt: string | null        // when seller confirmed shipment
    inspectionStartedAt: string | null  // when buyer marked as received
    completedAt: string | null      // when buyer approved
    disputedAt: string | null       // when buyer raised dispute
    refundedAt: string | null       // when refund was processed
    cancelledAt: string | null

    // ── Shipping details ──────────────────────────────────────────
    trackingNumber: string | null
    shippingProvider: string | null
    shippingAddress: ShippingAddress | null

    // ── Dispute ───────────────────────────────────────────────────
    disputeReason: string | null

    // ── Payment ───────────────────────────────────────────────────
    stripePaymentIntentId: string | null  // used to release/refund escrow

    createdAt: string
    updatedAt: string

    // ── Joined data (from Supabase select) ───────────────────────
    product?: {
        id: string
        title: string
        images: string[]
        price: number
        brand: string
    }
    buyer?: {
        id: string
        username: string
        avatarUrl: string | null
    }
    seller?: {
        id: string
        username: string
        avatarUrl: string | null
    }
}

/** Used when creating a new order at checkout */
export interface CreateOrderInput {
    productId: string
    sellerId: string
    amount: number
    shippingFee: number
    shippingAddress: ShippingAddress
    stripePaymentIntentId?: string
}

/** Status transition actions available per role */
export interface OrderAction {
    label: string
    description: string
    newStatus: OrderStatus
    availableFor: 'buyer' | 'seller' | 'admin'
    /** Which current statuses allow this action */
    fromStatuses: OrderStatus[]
    variant: 'primary' | 'danger' | 'secondary'
}

// All valid status transitions
export const ORDER_ACTIONS: OrderAction[] = [
    {
        label: 'Mark as Shipped',
        description: 'Confirm you have shipped the device and add a tracking number.',
        newStatus: 'shipped',
        availableFor: 'seller',
        fromStatuses: ['paid'],
        variant: 'primary',
    },
    {
        label: 'Mark as Received',
        description: 'Confirm you received the device. Your 5-day inspection window starts now.',
        newStatus: 'in_inspection',
        availableFor: 'buyer',
        fromStatuses: ['shipped'],
        variant: 'primary',
    },
    {
        label: 'Approve & Release Payment',
        description: 'Happy with the device? Release the payment to the seller.',
        newStatus: 'completed',
        availableFor: 'buyer',
        fromStatuses: ['in_inspection'],
        variant: 'primary',
    },
    {
        label: 'Raise a Dispute',
        description: 'Device not as described? Open a dispute for Go2Hand to review.',
        newStatus: 'disputed',
        availableFor: 'buyer',
        fromStatuses: ['in_inspection'],
        variant: 'danger',
    },
    {
        label: 'Cancel Order',
        description: 'Cancel this order before it is shipped.',
        newStatus: 'cancelled',
        availableFor: 'buyer',
        fromStatuses: ['pending', 'paid'],
        variant: 'danger',
    },
    {
        label: 'Issue Refund',
        description: 'Admin: refund the buyer and close the dispute.',
        newStatus: 'refunded',
        availableFor: 'admin',
        fromStatuses: ['disputed'],
        variant: 'danger',
    },
]