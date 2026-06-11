'use client'

// src/components/checkout/CheckoutClient.tsx
// ─────────────────────────────────────────────────────────────────
// 2-step checkout UI:
//   Step 1 — Shipping info form
//   Step 2 — Stripe Payment Element (embedded card form)
//
// IMPORTANT: This component does NOT render <Navbar> or <Footer>.
// The parent page.tsx owns the layout shell. This component only
// renders the checkout content area.
//
// Flow:
//   Submit shipping → POST /api/checkout → clientSecret + orderId
//   → Initialize Stripe Elements → buyer pays
//   → stripe.confirmPayment() → redirect to /checkout/success
// ─────────────────────────────────────────────────────────────────

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js'
import {
    ShieldCheckIcon,
    TruckIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    CheckCircleIcon,
    LockClosedIcon,
    ClockIcon,
} from '@heroicons/react/24/outline'
import type { Device } from '@/types/device'
import type { ShippingAddress } from '@/types/order'

// ── Initialize Stripe ONCE outside the component ─────────────────
// This avoids re-creating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Stripe Payment Element appearance — matches Go2Hand teal ──────
const STRIPE_APPEARANCE = {
    theme: 'stripe' as const,
    variables: {
        colorPrimary: '#0f766e',        // teal-700
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#dc2626',
        fontFamily: 'inherit',
        borderRadius: '12px',
        fontSizeBase: '14px',
    },
    rules: {
        '.Input': {
            borderColor: '#e5e7eb',
            boxShadow: 'none',
            padding: '12px',
        },
        '.Input:focus': {
            borderColor: '#0f766e',
            boxShadow: '0 0 0 3px rgba(15,118,110,0.1)',
        },
        '.Label': {
            color: '#6b7280',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        '.Error': {
            color: '#dc2626',
        },
    },
}

// ── Default empty address ─────────────────────────────────────────
const EMPTY_ADDRESS: ShippingAddress = {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Vietnam',
}

// ── Step indicator types ──────────────────────────────────────────
type Step = 'shipping' | 'payment'

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT — manages step state and Stripe initialization
// ─────────────────────────────────────────────────────────────────
interface CheckoutClientProps {
    device: Device
}

export default function CheckoutClient({ device }: CheckoutClientProps) {
    const [step,         setStep]         = useState<Step>('shipping')
    const [address,      setAddress]      = useState<ShippingAddress>(EMPTY_ADDRESS)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [orderId,      setOrderId]      = useState<string | null>(null)
    const [submitting,   setSubmitting]   = useState(false)
    const [error,        setError]        = useState<string | null>(null)

    const discount = device.originalPrice > device.price
        ? Math.round((1 - device.price / device.originalPrice) * 100)
        : 0

    // ── Step 1 submit — create PaymentIntent + order ──────────────
    async function handleShippingSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: device.id,
                    shippingAddress: address,
                    shippingFee: 0,   // free shipping
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Checkout failed')

            setClientSecret(data.clientSecret)
            setOrderId(data.orderId)
            setStep('payment')
            // Scroll to top so buyer sees the payment form
            window.scrollTo({ top: 0, behavior: 'smooth' })

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

            {/* ── Breadcrumb nav ── */}
            <nav className="flex items-center gap-1.5 mb-6 text-[12px] text-gray-400 flex-wrap">
                <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
                <span>›</span>
                <Link href={`/devices/${device.id}`} className="hover:text-teal-700 transition-colors truncate max-w-[180px]">
                    {device.fullName}
                </Link>
                <span>›</span>
                <span className="text-gray-600 font-medium">Checkout</span>
            </nav>

            {/* ── Step progress indicator ── */}
            <div className="flex items-center gap-3 mb-8">
                <StepBadge n={1} label="Shipping" active={step === 'shipping'} done={step === 'payment'} />
                <div className={`flex-1 h-0.5 transition-colors duration-500 rounded-full
                    ${step === 'payment' ? 'bg-teal-600' : 'bg-gray-200'}`} />
                <StepBadge n={2} label="Payment"  active={step === 'payment'}  done={false} />
            </div>

            {/* ── Two-column layout:
                  Mobile:  stacked (form → summary)
                  Desktop: form [1fr] | summary [380px] side-by-side
            ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

                {/* ══ LEFT: form (order-1 on mobile) ══ */}
                <div className="order-1">

                    {/* ── STEP 1: Shipping form ── */}
                    {step === 'shipping' && (
                        <ShippingForm
                            address={address}
                            onChange={setAddress}
                            onSubmit={handleShippingSubmit}
                            submitting={submitting}
                            error={error}
                        />
                    )}

                    {/* ── STEP 2: Stripe Payment Element ── */}
                    {step === 'payment' && clientSecret && orderId && (
                        <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
                        >
                            <StripePaymentForm
                                orderId={orderId}
                                devicePrice={device.price}
                                onBack={() => setStep('shipping')}
                            />
                        </Elements>
                    )}
                </div>

                {/* ══ RIGHT: Order summary (sticky on desktop, above form on mobile) ══ */}
                <aside className="order-2 lg:sticky lg:top-[78px] flex flex-col gap-3">
                    <OrderSummaryCard device={device} discount={discount} />
                    <EscrowExplainerCard />
                </aside>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// SHIPPING FORM — Step 1
// ─────────────────────────────────────────────────────────────────
function ShippingForm({
    address,
    onChange,
    onSubmit,
    submitting,
    error,
}: {
    address: ShippingAddress
    onChange: (a: ShippingAddress) => void
    onSubmit: (e: FormEvent) => void
    submitting: boolean
    error: string | null
}) {
    // Helper: returns value + onChange for a given field
    function field(key: keyof ShippingAddress) {
        return {
            value: address[key] ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                onChange({ ...address, [key]: e.target.value }),
        }
    }

    return (
        <form onSubmit={onSubmit}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">

            <div className="flex items-center gap-2 mb-6">
                <TruckIcon className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-gray-900">Shipping address</h2>
            </div>

            {/* Name + phone — side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Full name" required>
                    <input
                        {...field('fullName')}
                        placeholder="Nguyen Van A"
                        required
                        autoComplete="name"
                        className={inputCls}
                    />
                </Field>
                <Field label="Phone number" required>
                    <input
                        {...field('phone')}
                        type="tel"
                        placeholder="+84 909 123 456"
                        required
                        autoComplete="tel"
                        className={inputCls}
                    />
                </Field>
            </div>

            {/* Address line 1 */}
            <Field label="Address line 1" required className="mb-4">
                <input
                    {...field('addressLine1')}
                    placeholder="123 Nguyen Hue Street"
                    required
                    autoComplete="address-line1"
                    className={inputCls}
                />
            </Field>

            {/* Address line 2 — optional */}
            <Field label="Address line 2 (optional)" className="mb-4">
                <input
                    {...field('addressLine2')}
                    placeholder="Apartment, suite, floor…"
                    autoComplete="address-line2"
                    className={inputCls}
                />
            </Field>

            {/* City / State / Postal — 3-col on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <Field label="City" required>
                    <input
                        {...field('city')}
                        placeholder="Ho Chi Minh City"
                        required
                        autoComplete="address-level2"
                        className={inputCls}
                    />
                </Field>
                <Field label="Province / State" required>
                    <input
                        {...field('state')}
                        placeholder="HCM"
                        required
                        autoComplete="address-level1"
                        className={inputCls}
                    />
                </Field>
                <Field label="Postal code">
                    <input
                        {...field('postalCode')}
                        placeholder="70000"
                        autoComplete="postal-code"
                        className={inputCls}
                    />
                </Field>
            </div>

            {/* Country */}
            <Field label="Country" required className="mb-6">
                <select {...field('country')} required className={inputCls}>
                    <option value="Vietnam">🇻🇳 Vietnam</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                    <option value="Thailand">🇹🇭 Thailand</option>
                    <option value="Philippines">🇵🇭 Philippines</option>
                    <option value="Indonesia">🇮🇩 Indonesia</option>
                    <option value="Malaysia">🇲🇾 Malaysia</option>
                </select>
            </Field>

            {/* Error */}
            {error && <ErrorBanner msg={error} className="mb-5" />}

            {/* Submit */}
            <button
                type="submit"
                disabled={submitting}
                className="w-full h-[52px] bg-teal-800 hover:bg-teal-700 text-white font-bold
                    rounded-xl text-[15px] flex items-center justify-center gap-2
                    transition-all hover:-translate-y-0.5 hover:shadow-lg
                    disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0
                    active:scale-95"
            >
                {submitting ? <Spinner /> : (
                    <>
                        Continue to Payment
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </>
                )}
            </button>
        </form>
    )
}

// ─────────────────────────────────────────────────────────────────
// STRIPE PAYMENT FORM — Step 2
// Must be a child of <Elements> to use useStripe() / useElements()
// ─────────────────────────────────────────────────────────────────
function StripePaymentForm({
    orderId,
    devicePrice,
    onBack,
}: {
    orderId: string
    devicePrice: number
    onBack: () => void
}) {
    const stripe   = useStripe()
    const elements = useElements()
    const router   = useRouter()

    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return

        setError(null)
        setSubmitting(true)

        try {
            // Validate the Payment Element fields before submitting
            const { error: submitErr } = await elements.submit()
            if (submitErr) throw new Error(submitErr.message)

            // Confirm the PaymentIntent.
            // 'if_required' resolves immediately for non-3DS cards.
            // Cards requiring 3DS will redirect to return_url then back.
            const { error: confirmErr } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
                },
                redirect: 'if_required',
            })

            if (confirmErr) throw new Error(confirmErr.message)

            // Non-redirect payment succeeded — go to success page
            router.push(`/checkout/success?order_id=${orderId}`)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed — please try again')
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <LockClosedIcon className="w-5 h-5 text-teal-600" />
                    <h2 className="text-base font-bold text-gray-900">Payment details</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium
                    bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secured by Stripe
                </div>
            </div>

            {/* Stripe Payment Element */}
            <div className="mb-5">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        defaultValues: { billingDetails: {} },
                    }}
                />
            </div>

            {/* Test mode hint (remove before going live) */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-amber-700 font-medium mb-1">🧪 Test mode</p>
                <p className="text-xs text-amber-600">
                    Use card <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">4242 4242 4242 4242</code>
                    {' '}· Any future date · Any 3-digit CVC
                </p>
            </div>

            {/* What happens after payment */}
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3.5 mb-5">
                <p className="text-xs font-bold text-teal-900 mb-2 flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-600" />
                    Your money is protected
                </p>
                <div className="flex flex-col gap-1.5">
                    {[
                        'Payment is held — seller receives nothing yet',
                        'Seller ships with tracking number',
                        'You have 5 days to inspect after delivery',
                        'Approve → payment releases to seller',
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-teal-700">
                            <span className="w-4 h-4 rounded-full bg-teal-200 text-teal-800 flex items-center
                                justify-center text-[9px] font-bold shrink-0 mt-0.5">
                                {i + 1}
                            </span>
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && <ErrorBanner msg={error} className="mb-5" />}

            {/* Submit */}
            <button
                type="submit"
                disabled={!stripe || !elements || submitting}
                className="w-full h-[52px] bg-teal-800 hover:bg-teal-700 text-white font-bold
                    rounded-xl text-[15px] flex items-center justify-center gap-2
                    transition-all hover:-translate-y-0.5 hover:shadow-lg
                    disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0
                    active:scale-95"
            >
                {submitting ? <Spinner /> : (
                    <>
                        <ShieldCheckIcon className="w-4 h-4" />
                        Pay ${devicePrice} — Escrow Protected
                    </>
                )}
            </button>

            {/* Back to shipping */}
            <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm
                    text-gray-400 hover:text-gray-600 transition-colors py-2
                    disabled:opacity-40"
            >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to shipping
            </button>
        </form>
    )
}

// ─────────────────────────────────────────────────────────────────
// ORDER SUMMARY SIDEBAR CARD
// ─────────────────────────────────────────────────────────────────
function OrderSummaryCard({ device, discount }: { device: Device; discount: number }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Device thumbnail + info */}
            <div className="flex items-center gap-4 p-4 sm:p-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100
                    flex items-center justify-center shrink-0 overflow-hidden">
                    <Image
                        src={device.images[0]}
                        alt={device.fullName}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain p-1"
                        unoptimized
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                        {device.brand}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                        {device.fullName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {device.storage} · Grade {device.grade} · Unlocked
                    </p>
                </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4 sm:p-5 flex flex-col gap-2.5 border-b border-gray-100">
                <SummaryRow label="Device price" value={`$${device.price}`} />
                <SummaryRow label="Shipping" value="Free" green />
                <SummaryRow label="Platform fee" value="$0" muted />
                <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">${device.price}</span>
                </div>
                {discount > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold text-center
                        bg-emerald-50 rounded-lg py-1.5">
                        You save ${device.originalPrice - device.price} ({discount}% off retail)
                    </p>
                )}
            </div>

            {/* Trust badges */}
            <div className="px-4 sm:px-5 py-4 flex flex-col gap-2.5">
                {[
                    { icon: ShieldCheckIcon, text: `Funds held in escrow` },
                    { icon: TruckIcon,       text: `Free shipping · ${device.shippingDays}` },
                    { icon: ArrowPathIcon,   text: '30-day hassle-free returns' },
                    { icon: ClockIcon,       text: '5-day inspection window' },
                ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-gray-500">
                        <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                        {text}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// ESCROW EXPLAINER CARD
// ─────────────────────────────────────────────────────────────────
function EscrowExplainerCard() {
    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                    <p className="text-sm font-bold text-emerald-900 mb-1">How escrow works</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                        Your payment is ring-fenced on your card — not charged to the seller yet.
                        Once the device arrives, you have <strong>5 days to inspect</strong> it.
                        Approve it → money moves. Dispute it → money stays with you.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// SMALL HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────

// Shared input class
const inputCls = `
    w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800
    focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition
    placeholder:text-gray-400 bg-white
`

// Labeled form field wrapper
function Field({
    label,
    required,
    className = '',
    children,
}: {
    label: string
    required?: boolean
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={className}>
            <label className="block text-[11px] font-bold text-gray-400 uppercase
                tracking-wider mb-1.5">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    )
}

// Step progress badge
function StepBadge({
    n,
    label,
    active,
    done,
}: {
    n: number
    label: string
    active: boolean
    done: boolean
}) {
    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-xs font-bold transition-all duration-300
                ${done ? 'bg-teal-600 text-white'
                       : active ? 'bg-teal-800 text-white'
                       : 'bg-gray-200 text-gray-500'}`}>
                {done ? <CheckCircleIcon className="w-4 h-4" /> : n}
            </div>
            <span className={`text-sm font-semibold transition-colors duration-300
                ${active ? 'text-gray-900' : done ? 'text-teal-700' : 'text-gray-400'}`}>
                {label}
            </span>
        </div>
    )
}

// Error banner
function ErrorBanner({ msg, className = '' }: { msg: string; className?: string }) {
    return (
        <div className={`flex items-start gap-2.5 bg-red-50 border border-red-200
            rounded-xl px-4 py-3 ${className}`}>
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-700">{msg}</p>
        </div>
    )
}

// Summary row in the order card
function SummaryRow({
    label,
    value,
    muted = false,
    green = false,
}: {
    label: string
    value: string
    muted?: boolean
    green?: boolean
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            <span className={`text-sm font-medium ${
                green ? 'text-emerald-600 font-semibold' :
                muted ? 'text-gray-400' : 'text-gray-800'
            }`}>{value}</span>
        </div>
    )
}

// Loading spinner
function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}