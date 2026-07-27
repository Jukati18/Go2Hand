'use client'
// src/components/sell/StepDetails.tsx
// ─────────────────────────────────────────────────────────────────
// Step 2: Model selection with auto-fill specs.
//
// Flow:
//   Pick model from dropdown → specs auto-fill into editable fields
//   → seller can override any field → also enter color + storage
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { SparklesIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { getModelsForBrand } from '@/services/modelSpecService'
import type { ModelOption } from '@/services/modelSpecService'
import type { SellFormData } from '@/hooks/useSellForm'

// Storage options (universal — applies to all categories)
const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']

const COLOR_PRESETS = [
    { name: 'Black',       hex: '#1a1a1a' },
    { name: 'White',       hex: '#f5f5f5' },
    { name: 'Silver',      hex: '#c0c0c0' },
    { name: 'Space Gray',  hex: '#4a4a4a' },
    { name: 'Gold',        hex: '#c9a84c' },
    { name: 'Blue',        hex: '#2a5caa' },
    { name: 'Purple',      hex: '#7c3aed' },
    { name: 'Red',         hex: '#dc2626' },
    { name: 'Green',       hex: '#16a34a' },
    { name: 'Yellow',      hex: '#ca8a04' },
    { name: 'Pink',        hex: '#db2777' },
    { name: 'Orange',      hex: '#ea580c' },
]

// Spec field labels shown to the seller
const SPEC_FIELDS: { key: string; label: string; placeholder: string }[] = [
    { key: 'ram',     label: 'RAM',          placeholder: 'e.g. 8GB'                },
    { key: 'display', label: 'Display',      placeholder: 'e.g. 6.1-inch OLED'     },
    { key: 'chip',    label: 'Processor',    placeholder: 'e.g. A15 Bionic'         },
    { key: 'camera',  label: 'Camera',       placeholder: 'e.g. 12MP + 12MP Ultra'  },
    { key: 'battery', label: 'Battery',      placeholder: 'e.g. 3227 mAh'           },
    { key: 'os',      label: 'OS / Version', placeholder: 'e.g. iOS 17'             },
]

interface StepDetailsProps {
    data: SellFormData
    errors: Partial<Record<string, string>>
    patch: (updates: Partial<SellFormData>) => void
}

export default function StepDetails({ data, errors, patch }: StepDetailsProps) {
    const [models,  setModels]  = useState<ModelOption[]>([])
    const [loading, setLoading] = useState(false)
    // Track if specs were auto-filled so we can show the "auto-filled" badge
    const [autoFilled, setAutoFilled] = useState(false)

    // Load models when brand changes
    useEffect(() => {
        if (!data.brand) return
         
        setLoading(true)
        getModelsForBrand(data.brand.id).then(m => {
            setModels(m)
            setLoading(false)
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.brand?.id])

    // Build the title when brand/model changes
    function buildTitle(model: ModelOption | null): string {
        if (!model) return ''
        const brand = data.brand?.name ?? ''
        const storage = data.storage || ''
        return `${brand} ${model.model_name}${storage ? ' ' + storage : ''}`.trim()
    }

    function handleModelSelect(modelId: string) {
        const model = models.find(m => m.id === modelId) ?? null
        if (!model) {
            patch({ model: null, specs: {}, customTitle: '', originalPrice: '' })
            setAutoFilled(false)
            return
        }

        // Auto-fill specs from the model's stored data
        const autoSpecs: Record<string, string> = {}
        if (model.specs) {
            Object.entries(model.specs).forEach(([k, v]) => {
                if (v) autoSpecs[k] = String(v)
            })
        }

        const hasSpecs = Object.keys(autoSpecs).length > 0
        setAutoFilled(hasSpecs)

        patch({
            model,
            specs: autoSpecs,
            customTitle: buildTitle(model),
            originalPrice: model.suggested_retail_price ?? '',
        })
    }

    function handleSpecChange(key: string, value: string) {
        patch({ specs: { ...data.specs, [key]: value } })
    }

    return (
        <div className="flex flex-col gap-7">

            {/* ── MODEL SELECTION ── */}
            <section>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-800">
                        Device Model <span className="text-red-400">*</span>
                    </h3>
                    {autoFilled && (
                        <span className="flex items-center gap-1 text-[10px] font-bold
                            text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full">
                            <SparklesIcon className="w-3 h-3" />
                            Specs auto-filled!
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Select your model to auto-fill specs — or skip and enter details manually.
                </p>

                {loading ? (
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                ) : (
                    <div className="relative">
                        <select
                            value={data.model?.id ?? ''}
                            onChange={e => handleModelSelect(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                                text-gray-800 bg-white appearance-none outline-none
                                focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                        >
                            <option value="">— Select a model (or type a custom name below)</option>
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.model_name}</option>
                            ))}
                        </select>
                        {/* Chevron */}
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                            text-gray-400 pointer-events-none"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                )}

                {errors.model && (
                    <p className="text-xs text-red-500 mt-1.5">{errors.model}</p>
                )}

                {/* Custom listing title — editable */}
                <div className="mt-3">
                    <label className="block text-[11px] font-bold text-gray-400
                        uppercase tracking-wider mb-1.5">
                        Listing Title (editable)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.customTitle}
                            onChange={e => patch({ customTitle: e.target.value })}
                            placeholder="e.g. Apple iPhone 15 Pro 256GB Natural Titanium"
                            maxLength={100}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10
                                text-sm text-gray-800 outline-none
                                focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition
                                placeholder:text-gray-400"
                        />
                        <PencilSquareIcon className="absolute right-3 top-1/2 -translate-y-1/2
                            w-4 h-4 text-gray-300 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                        {data.customTitle.length}/100 chars — this appears in search results
                    </p>
                </div>
            </section>

            {/* ── STORAGE + COLOR ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Storage */}
                <section>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                        Storage <span className="text-red-400">*</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {STORAGE_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                    patch({
                                        storage: opt,
                                        customTitle: buildTitle(data.model)
                                            .replace(/\d+GB|\d+TB/g, opt)
                                            .trim() || `${data.brand?.name ?? ''} ${data.model?.model_name ?? ''} ${opt}`.trim()
                                    })
                                }}
                                className={`px-3.5 py-2 rounded-xl border-2 text-xs font-semibold
                                    transition-all duration-150
                                    ${data.storage === opt
                                        ? 'bg-teal-800 border-teal-800 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                        {/* Custom storage */}
                        <input
                            type="text"
                            placeholder="Custom…"
                            value={STORAGE_OPTIONS.includes(data.storage) ? '' : data.storage}
                            onChange={e => patch({ storage: e.target.value })}
                            className="px-3 py-2 rounded-xl border-2 border-dashed border-gray-200
                                text-xs text-gray-600 w-20 outline-none
                                focus:border-teal-400 placeholder:text-gray-300"
                        />
                    </div>
                    {errors.storage && (
                        <p className="text-xs text-red-500 mt-1.5">{errors.storage}</p>
                    )}
                </section>

                {/* Color */}
                <section>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                        Color <span className="text-red-400">*</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {COLOR_PRESETS.map(c => (
                            <button
                                key={c.name}
                                type="button"
                                title={c.name}
                                onClick={() => patch({ color: c.name })}
                                className={`w-7 h-7 rounded-full border-2 transition-all duration-150
                                    ${data.color === c.name
                                        ? 'border-teal-600 scale-110 shadow-md'
                                        : 'border-transparent hover:border-gray-400 hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c.hex }}
                            />
                        ))}
                    </div>
                    <input
                        type="text"
                        value={data.color}
                        onChange={e => patch({ color: e.target.value })}
                        placeholder="e.g. Natural Titanium"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm
                            text-gray-800 outline-none
                            focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition
                            placeholder:text-gray-400"
                    />
                    {errors.color && (
                        <p className="text-xs text-red-500 mt-1.5">{errors.color}</p>
                    )}
                </section>
            </div>

            {/* ── SPECS — auto-filled + editable ── */}
            <section>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-800">Technical Specifications</h3>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                        Optional — auto-filled when available
                    </span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                    Help buyers compare accurately. These appear in the full specs table on your listing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SPEC_FIELDS.map(field => (
                        <div key={field.key}>
                            <label className="block text-[11px] font-bold text-gray-400
                                uppercase tracking-wider mb-1.5">
                                {field.label}
                                {autoFilled && data.specs[field.key] && (
                                    <span className="ml-1.5 normal-case font-normal text-teal-500">
                                        ✓ auto-filled
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={data.specs[field.key] ?? ''}
                                onChange={e => handleSpecChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5
                                    text-sm text-gray-800 outline-none
                                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition
                                    placeholder:text-gray-400"
                            />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}