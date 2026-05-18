'use client'

// src/components/checkout/CheckoutClient.tsx
// ─────────────────────────────────────────────────────────────────
// 2-step checkout:
//   Step 1 — Shipping info form (plain HTML form)
//   Step 2 — Stripe Payment Element (embedded card form)
//
// Flow:
//   Submit shipping → POST /api/checkout → get clientSecret + orderId
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
} from '@heroicons/react/24/outline'
import type { Device } from '@/types/device'
import type { ShippingAddress } from '@/types/order'

// Initialize Stripe.js outside of component to avoid re-creating on render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Stripe appearance that matches the Go2Hand teal palette ──────
const STRIPE_APPEARANCE = {
    theme: 'stripe' as const,
    variables: {
        colorPrimary: '#0f766e',      // teal-700
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#dc2626',
        fontFamily: 'inherit',
        borderRadius: '12px',
        fontSizeBase: '14px',
    },
    rules: {
        '.Input': { borderColor: '#e5e7eb', boxShadow: 'none', padding: '12px' },
        '.Input:focus': { borderColor: '#0f766e', boxShadow: '0 0 0 3px rgba(15,118,110,0.1)' },
        '.Label': { color: '#6b7280', fontSize: '12px', fontWeight: '600' },
    },
}

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface CheckoutClientProps {
    device: Device
}

type Step = 'shipping' | 'payment'

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

// ─────────────────────────────────────────────────────────────────
// Main export — manages step state and Stripe setup
// ─────────────────────────────────────────────────────────────────
export default function CheckoutClient({ device }: CheckoutClientProps) {
    const [step, setStep] = useState<Step>('shipping')
    const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const discount = Math.round((1 - device.price / device.originalPrice) * 100)

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
                    shippingFee: 0, // free shipping
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Checkout failed')

            setClientSecret(data.clientSecret)
            setOrderId(data.orderId)
            setStep('payment')
            window.scrollTo({ top: 0, behavior: 'smooth' })

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-[1100px] mx-auto px-6 py-10">

            {/* ── Progress bar ── */}
            <div className="flex items-center gap-3 mb-8">
                <StepBadge n={1} label="Shipping" active={step === 'shipping'} done={step === 'payment'} />
                <div className={`flex-1 h-0.5 transition-colors duration-500 ${step === 'payment' ? 'bg-teal-600' : 'bg-gray-200'}`} />
                <StepBadge n={2} label="Payment" active={step === 'payment'} done={false} />
            </div>

            <div className="grid grid-cols-[1fr_380px] gap-8 items-start">

                {/* ══ LEFT: form area ══ */}
                <div>
                    {step === 'shipping' && (
                        <ShippingForm
                            address={address}
                            onChange={setAddress}
                            onSubmit={handleShippingSubmit}
                            submitting={submitting}
                            error={error}
                        />
                    )}

                    {step === 'payment' && clientSecret && orderId && (
                        <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
                        >
                            <StripePaymentForm
                                orderId={orderId}
                                onBack={() => setStep('shipping')}
                            />
                        </Elements>
                    )}
                </div>

                {/* ══ RIGHT: order summary (always visible) ══ */}
                <aside className="sticky top-[78px]">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                        {/* Device thumb + name */}
                        <div className="flex items-center gap-4 p-5 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100
                                flex items-center justify-center shrink-0 overflow-hidden">
                                <Image
                                    src={device.images[0]}
                                    alt={device.fullName}
                                    width={64} height={64}
                                    className="w-full h-full object-contain p-1"
                                    unoptimized
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                                    {device.brand}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                                    {device.fullName}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {device.storage} · Grade {device.grade}
                                </p>
                            </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="p-5 flex flex-col gap-3">
                            <SummaryLine label="Device" value={`$${device.price}`} />
                            <SummaryLine label="Shipping" value="Free" />
                            <SummaryLine label="Platform fee" value="$0" muted />

                            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900">${device.price}</span>
                            </div>

                            {discount > 0 && (
                                <p className="text-xs text-emerald-600 font-semibold text-center">
                                    You save ${device.originalPrice - device.price} ({discount}% off)
                                </p>
                            )}
                        </div>

                        {/* Trust badges */}
                        <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-2.5">
                            {[
                                { icon: ShieldCheckIcon, text: 'Funds held in escrow until you approve' },
                                { icon: TruckIcon, text: `Free shipping · ${device.shippingDays}` },
                                { icon: ArrowPathIcon, text: '30-day hassle-free returns' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2.5 text-xs text-gray-500">
                                    <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Escrow explain */}
                    <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-emerald-900 mb-0.5">How escrow works</p>
                                <p className="text-xs text-emerald-700 leading-relaxed">
                                    Your payment is held securely — we only release it to the seller after
                                    you inspect and approve the device within 5 days of delivery.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Step 1: Shipping info form
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
    function field(key: keyof ShippingAddress) {
        return {
            value: address[key] ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                onChange({ ...address, [key]: e.target.value }),
        }
    }

    return (
        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h2 className="text-base font-bold text-gray-900 mb-6">Shipping information</h2>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Full name" required>
                    <input
                        {...field('fullName')}
                        placeholder="Nguyen Van A"
                        required
                        className={inputCls}
                    />
                </Field>
                <Field label="Phone number" required>
                    <input
                        {...field('phone')}
                        type="tel"
                        placeholder="+84 909 123 456"
                        required
                        className={inputCls}
                    />
                </Field>
            </div>

            {/* Address */}
            <Field label="Address line 1" required className="mb-4">
                <input
                    {...field('addressLine1')}
                    placeholder="123 Nguyen Hue Street"
                    required
                    className={inputCls}
                />
            </Field>

            <Field label="Address line 2 (optional)" className="mb-4">
                <input
                    {...field('addressLine2')}
                    placeholder="Apartment, suite, etc."
                    className={inputCls}
                />
            </Field>

            {/* City / State / Postal */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="City" required>
                    <input {...field('city')} placeholder="Ho Chi Minh City" required className={inputCls} />
                </Field>
                <Field label="Province / State" required>
                    <input {...field('state')} placeholder="HCM" required className={inputCls} />
                </Field>
                <Field label="Postal code">
                    <input {...field('postalCode')} placeholder="70000" className={inputCls} />
                </Field>
            </div>

            {/* Country */}
            <Field label="Country" required className="mb-6">
                <select {...field('country')} required className={inputCls}>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Indonesia">Indonesia</option>
                </select>
            </Field>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl
                    px-4 py-3 mb-5">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full h-[52px] bg-teal-800 hover:bg-teal-700 text-white font-bold
                    rounded-xl text-[15px] flex items-center justify-center gap-2
                    transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60
                    disabled:cursor-wait disabled:translate-y-0"
            >
                {submitting ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Setting up payment…
                    </>
                ) : 'Continue to Payment →'}
            </button>
        </form>
    )
}

// ─────────────────────────────────────────────────────────────────
// Step 2: Stripe Payment Element
// Must be a child of <Elements> to use useStripe() / useElements()
// ─────────────────────────────────────────────────────────────────
function StripePaymentForm({
    orderId,
    onBack,
}: {
    orderId: string
    onBack: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
            // 'if_required' means non-3DS card payments resolve immediately (no redirect).
            // 3DS cards and other redirect-based methods will redirect to return_url.
            const { error: confirmErr } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
                },
                redirect: 'if_required',
            })

            if (confirmErr) {
                // Card declined, insufficient funds, etc.
                throw new Error(confirmErr.message)
            }

            // Non-redirect payment succeeded — navigate to success page
            router.push(`/checkout/success?order_id=${orderId}`)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed — please try again')
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-gray-900">Payment details</h2>
                <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secured by Stripe
                </span>
            </div>

            {/* Stripe's Payment Element — handles card, wallets, BNPL etc. */}
            <div className="mb-6">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        defaultValues: { billingDetails: {} },
                    }}
                />
            </div>

            {/* Test card hint (remove in production) */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-5 text-xs text-amber-700">
                <strong>Test mode:</strong> Use card <code className="font-mono">4242 4242 4242 4242</code>,
                any future date, any CVC.
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl
                    px-4 py-3 mb-5">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || !elements || submitting}
                className="w-full h-[52px] bg-teal-800 hover:bg-teal-700 text-white font-bold
                    rounded-xl text-[15px] flex items-center justify-center gap-2
                    transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60
                    disabled:cursor-wait disabled:translate-y-0"
            >
                {submitting ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Processing…
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Confirm & Pay (Escrow)
                    </>
                )}
            </button>

            <button
                type="button"
                onClick={onBack}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm
                    text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to shipping
            </button>
        </form>
    )
}

// ─────────────────────────────────────────────────────────────────
// Small helper components
// ─────────────────────────────────────────────────────────────────
const inputCls = `
    w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800
    focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition
    placeholder:text-gray-400
`

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
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    )
}

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${done ? 'bg-teal-600 text-white' : active ? 'bg-teal-800 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {done ? <CheckCircleIcon className="w-4 h-4" /> : n}
            </div>
            <span className={`text-sm font-semibold transition-colors duration-300
                ${active ? 'text-gray-900' : done ? 'text-teal-700' : 'text-gray-400'}`}>
                {label}
            </span>
        </div>
    )
}

function SummaryLine({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            <span className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
        </div>
    )
}