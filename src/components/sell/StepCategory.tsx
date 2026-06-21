'use client'
// src/components/sell/StepCategory.tsx
// ─────────────────────────────────────────────────────────────────
// Step 1: Choose category → then brand.
// Brands load after category is picked (though currently all brands
// are shown — the filter can be tightened once the DB has category-
// brand join data).
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { getCategories, getBrandsForSell } from '@/services/modelSpecService'
import type { CategoryOption, BrandOption } from '@/services/modelSpecService'
import type { SellFormData } from '@/hooks/useSellForm'

// Category icons map
const CATEGORY_ICONS: Record<string, string> = {
    smartphones: '📱',
    laptops:     '💻',
    tablets:     '⬛',
    watches:     '⌚',
    audio:       '🎧',
    desktops:    '🖥️',
}

interface StepCategoryProps {
    data: SellFormData
    errors: Partial<Record<string, string>>
    patch: (updates: Partial<SellFormData>) => void
}

export default function StepCategory({ data, errors, patch }: StepCategoryProps) {
    const [categories, setCategories] = useState<CategoryOption[]>([])
    const [brands,     setBrands]     = useState<BrandOption[]>([])
    const [loading,    setLoading]    = useState(true)

    useEffect(() => {
        Promise.all([getCategories(), getBrandsForSell()]).then(([cats, brs]) => {
            setCategories(cats)
            setBrands(brs)
            setLoading(false)
        })
    }, [])

    return (
        <div className="flex flex-col gap-8">

            {/* ── CATEGORY ── */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                    What type of device are you selling?
                    <span className="text-red-400 ml-0.5">*</span>
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    This helps buyers find your listing and sets the right spec fields.
                </p>

                {loading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {categories.map(cat => {
                            const selected = data.category?.id === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        // Reset brand when category changes
                                        patch({ category: cat, brand: null, model: null })
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2
                                        transition-all duration-200 text-center
                                        ${selected
                                            ? 'border-teal-600 bg-teal-50 shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-teal-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-2xl leading-none">
                                        {CATEGORY_ICONS[cat.slug] ?? '📦'}
                                    </span>
                                    <span className={`text-[11px] font-bold leading-tight
                                        ${selected ? 'text-teal-800' : 'text-gray-600'}`}>
                                        {cat.name}
                                    </span>
                                    {selected && (
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-teal-600" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}

                {errors.category && (
                    <p className="text-xs text-red-500 mt-2">{errors.category}</p>
                )}
            </section>

            {/* ── BRAND — appears after category is chosen ── */}
            {data.category && (
                <section className="animate-[fadeUp_.25s_ease_both]">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                        Brand <span className="text-red-400">*</span>
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                        Select the manufacturer of your device.
                    </p>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                        {brands.map(brand => {
                            const selected = data.brand?.id === brand.id
                            return (
                                <button
                                    key={brand.id}
                                    type="button"
                                    onClick={() => patch({ brand, model: null, specs: {}, customTitle: '' })}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2
                                        transition-all duration-200
                                        ${selected
                                            ? 'border-teal-600 bg-teal-50'
                                            : 'border-gray-100 bg-white hover:border-teal-300'
                                        }`}
                                >
                                    {brand.logo_url ? (
                                        <Image
                                            src={brand.logo_url}
                                            alt={brand.name}
                                            width={40}
                                            height={40}
                                            sizes="40px"
                                            className="w-8 h-8 object-contain"
                                        />
                                    ) : (
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                            text-sm font-black
                                            ${selected ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {brand.name[0]}
                                        </div>
                                    )}
                                    <span className={`text-[11px] font-semibold text-center leading-tight
                                        ${selected ? 'text-teal-800' : 'text-gray-600'}`}>
                                        {brand.name}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {errors.brand && (
                        <p className="text-xs text-red-500 mt-2">{errors.brand}</p>
                    )}
                </section>
            )}
        </div>
    )
}