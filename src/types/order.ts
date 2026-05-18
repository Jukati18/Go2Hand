// src/types/order.ts
// ============================================
// ORDER TYPES — Go2Hand Escrow Order System
//
// Escrow flow:
//   pending → paid → shipped → in_inspection → completed
//                                             → disputed → refunded
//   Any stage before "shipped" → cancelled
// ============================================

export type OrderStatus =
    | 'pending'        // Order created, Stripe payment not yet confirmed
    | 'paid'           // Stripe PaymentIntent authorized (held) — money in escrow
    | 'shipped'        // Seller added tracking number
    | 'in_inspection'  // Buyer received device — 5-day window active
    | 'completed'      // Buyer approved → stripe.paymentIntents.capture() called
    | 'disputed'       // Buyer raised issue during inspection
    | 'refunded'       // stripe.paymentIntents.cancel() called — hold released
    | 'cancelled'      // Cancelled before payment

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

export interface Order {
    id: string
    buyerId: string
    sellerId: string
    productId: string

    amount: number
    shippingFee: number
    platformFee: number
    total: number

    status: OrderStatus

    paidAt: string | null
    shippedAt: string | null
    inspectionStartedAt: string | null
    completedAt: string | null
    disputedAt: string | null
    refundedAt: string | null
    cancelledAt: string | null

    trackingNumber: string | null
    shippingProvider: string | null
    shippingAddress: ShippingAddress | null

    disputeReason: string | null
    stripePaymentIntentId: string | null

    createdAt: string
    updatedAt: string

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

export interface CreateOrderInput {
    productId: string
    sellerId: string
    amount: number
    shippingFee: number
    shippingAddress: ShippingAddress
    stripePaymentIntentId?: string
    // ── NEW: defaults to 'paid' for backward compat, pass 'pending' when
    // creating the order before Stripe payment is confirmed.
    initialStatus?: 'pending' | 'paid'
}

export interface OrderAction {
    label: string
    description: string
    newStatus: OrderStatus
    availableFor: 'buyer' | 'seller' | 'admin'
    fromStatuses: OrderStatus[]
    variant: 'primary' | 'danger' | 'secondary'
}

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