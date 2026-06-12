'use client'
// src/components/sell/StepPricing.tsx
// ─────────────────────────────────────────────────────────────────
// Step 4: Set your asking price with a market-based suggestion.
// Shows a price range derived from the model's retail price + condition.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import {
    CurrencyDollarIcon,
    LightBulbIcon,
    CheckCircleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { getPricingSuggestion } from '@/services/modelSpecService'
import type { SellFormData } from '@/hooks/useSellForm'

// Condition display labels for the review card
const CONDITION_LABELS: Record<string, string> = {
    like_new:  'Like New (A+)',
    excellent: 'Excellent (A)',
    good:      'Good (B)',
    fair:      'Fair (C)',
}

interface StepPricingProps {
    data: SellFormData
    errors: Partial<Record<string, string>>
    patch: (updates: Partial<SellFormData>) => void
}

export default function StepPricing({ data, errors, patch }: StepPricingProps) {
    const [priceInput, setPriceInput] = useState(
        data.price !== '' ? String(data.price) : ''
    )
    const [origInput, setOrigInput] = useState(
        data.originalPrice !== '' ? String(data.originalPrice) : ''
    )

    // Compute the pricing suggestion based on model retail price + condition
    const suggestion = getPricingSuggestion(
        data.model?.suggested_retail_price ?? (data.originalPrice ? Number(data.originalPrice) : null),
        data.condition
    )

    // Keep parent form in sync when inputs change
    useEffect(() => {
        const n = Number(priceInput)
        patch({ price: priceInput === '' ? '' : isNaN(n) ? '' : n })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceInput])

    useEffect(() => {
        const n = Number(origInput)
        patch({ originalPrice: origInput === '' ? '' : isNaN(n) ? '' : n })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origInput])

    // Discount % shown to buyer
    const discount = data.price && data.originalPrice && Number(data.originalPrice) > Number(data.price)
        ? Math.round((1 - Number(data.price) / Number(data.originalPrice)) * 100)
        : 0

    function applysuggested() {
        if (!suggestion) return
        setPriceInput(String(suggestion.suggested))
        if (!origInput && data.model?.suggested_retail_price) {
            setOrigInput(String(data.model.suggested_retail_price))
        }
    }

    return (
        <div className="flex flex-col gap-7">

            {/* ── LISTING REVIEW CARD ── */}
            <section className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Your Listing Summary
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
                    {[
                        { label: 'Category', value: data.category?.name ?? '—' },
                        { label: 'Brand',    value: data.brand?.name ?? '—' },
                        { label: 'Model', value: (data.model?.model_name ?? data.customTitle) || '—' },
                        { label: 'Storage',  value: data.storage || '—' },
                        { label: 'Color',    value: data.color || '—' },
                        { label: 'Condition',value: CONDITION_LABELS[data.condition] ?? '—' },
                        { label: 'Battery',  value: data.batteryHealth ? `${data.batteryHealth}%` : '—' },
                        { label: 'Photos',   value: `${data.photos.length} uploaded` },
                        { label: 'IMEI',     value: data.imeiStatus === 'clean' ? '✓ Clean' : data.imeiStatus === 'flagged' ? '⚠ Flagged' : '—' },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PRICING SUGGESTION ── */}
            {suggestion && (
                <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5
                    animate-[fadeUp_.3s_ease_both]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center
                            justify-center shrink-0">
                            <LightBulbIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-amber-900 mb-0.5">
                                Market Price Suggestion
                            </p>
                            <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                                Based on similar {data.condition.replace('_', ' ')} {data.brand?.name ?? ''} devices
                                currently selling on the market.
                            </p>

                            {/* Price range visual */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1 bg-amber-100 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Min</p>
                                    <p className="text-lg font-black text-amber-800">${suggestion.min}</p>
                                </div>
                                <div className="flex-1 bg-amber-500 rounded-xl p-3 text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-amber-100 uppercase tracking-wide mb-0.5">Suggested</p>
                                    <p className="text-xl font-black text-white">${suggestion.suggested}</p>
                                </div>
                                <div className="flex-1 bg-amber-100 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Max</p>
                                    <p className="text-lg font-black text-amber-800">${suggestion.max}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={applysuggested}
                                className="w-full h-9 bg-amber-500 hover:bg-amber-400 text-white
                                    font-semibold text-xs rounded-xl transition-colors"
                            >
                                Use suggested price (${suggestion.suggested})
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* ── PRICE INPUTS ── */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                    Set Your Price <span className="text-red-400">*</span>
                </h3>
                <p className="text-xs text-gray-400 mb-5">
                    Competitive pricing (10–15% below similar listings) typically leads to faster sales.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                    {/* Asking price */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400
                            uppercase tracking-wider mb-1.5">
                            Asking Price (USD) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2
                                text-gray-400 text-lg font-semibold">$</span>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={priceInput}
                                onChange={e => setPriceInput(e.target.value)}
                                placeholder="0"
                                className={`w-full border rounded-xl pl-8 pr-4 py-3 text-lg
                                    font-bold text-gray-900 outline-none transition
                                    ${errors.price
                                        ? 'border-red-400 ring-2 ring-red-100'
                                        : 'border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
                                    }`}
                            />
                        </div>
                        {errors.price && (
                            <p className="text-xs text-red-500 mt-1.5">{errors.price}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1.5">
                            This is what buyers pay. You receive this minus 5% platform fee.
                        </p>
                    </div>

                    {/* Original retail price */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400
                            uppercase tracking-wider mb-1.5">
                            Original Retail Price (USD)
                            <span className="text-gray-300 font-normal ml-1">(optional)</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2
                                text-gray-400 text-lg font-semibold">$</span>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={origInput}
                                onChange={e => setOrigInput(e.target.value)}
                                placeholder="0"
                                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3
                                    text-lg font-bold text-gray-900 outline-none transition
                                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                            Shows buyers how much they save vs. buying new.
                        </p>
                    </div>
                </div>

                {/* Discount preview */}
                {discount > 0 && (
                    <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200
                        rounded-xl px-4 py-3 animate-[fadeUp_.2s_ease_both]">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm text-emerald-800">
                            Buyers will see{' '}
                            <span className="font-bold">{discount}% off</span>{' '}
                            retail — this is a strong selling point!
                        </p>
                    </div>
                )}
            </section>

            {/* ── PAYOUT PREVIEW ── */}
            {data.price && Number(data.price) > 0 && (
                <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm
                    animate-[fadeUp_.3s_ease_both]">
                    <div className="flex items-center gap-2 mb-4">
                        <CurrencyDollarIcon className="w-4 h-4 text-teal-600" />
                        <h3 className="text-sm font-bold text-gray-900">Your Payout Breakdown</h3>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {[
                            { label: 'Listing price', value: `$${Number(data.price).toLocaleString()}`, bold: false },
                            { label: 'Platform fee (5%)', value: `-$${(Number(data.price) * 0.05).toFixed(2)}`, bold: false, muted: true },
                            { label: 'Shipping (free for buyers)', value: '$0', bold: false, muted: true },
                        ].map(({ label, value, bold, muted }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {label}
                                </span>
                                <span className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-800'} ${bold ? 'font-bold' : ''}`}>
                                    {value}
                                </span>
                            </div>
                        ))}
                        <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">You receive</span>
                            <span className="text-xl font-black text-teal-700">
                                ${(Number(data.price) * 0.95).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
                        <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                            Payment is held in escrow until the buyer approves the device (5-day window).
                            Released to your account within 1–3 business days after approval.
                        </span>
                    </div>
                </section>
            )}

            {/* ── TERMS ── */}
            <section className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
                <p className="text-xs text-gray-500 leading-relaxed">
                    By publishing this listing you confirm the device is yours to sell,
                    the information is accurate, and you agree to Go2Hand's{' '}
                    <a href="/seller-guidelines" className="text-teal-600 hover:underline">
                        Seller Guidelines
                    </a>{' '}
                    and{' '}
                    <a href="/terms" className="text-teal-600 hover:underline">Terms of Service</a>.
                    Misrepresentation may result in account suspension.
                </p>
            </section>
        </div>
    )
}