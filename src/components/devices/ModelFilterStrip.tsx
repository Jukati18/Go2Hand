'use client'
// src/components/devices/ModelFilterStrip.tsx
// ─────────────────────────────────────────────────────────────────
// Shows model quick-filter chips when a search query matches known
// device models. Rendered at the top of the /devices results page.
//
// Example: User searches "iPhone 15"
//   → Strip shows: [iPhone 15] [iPhone 15 Pro] [iPhone 15 Plus]
//   → Each chip links to /categories/smartphones/apple?model=...
//
// The strip is invisible when:
//   • No query
//   • No matching models
//   • Still loading (renders skeleton)
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CpuChipIcon } from '@heroicons/react/24/outline'
import { getModelSuggestions, type ModelSuggestion } from '@/services/searchService'

interface ModelFilterStripProps {
    /** Current search query from ?q= param */
    query: string
}

export default function ModelFilterStrip({ query }: ModelFilterStripProps) {
    const [models,  setModels]  = useState<ModelSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [fetched, setFetched] = useState('')

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!query || query.trim().length < 2) {
            setModels([])
            setFetched('')
            return
        }
        // Don't re-fetch for the same query
        if (query === fetched) return

        setLoading(true)
        getModelSuggestions(query, 6).then(m => {
            setModels(m)
            setFetched(query)
            setLoading(false)
        })
    }, [query, fetched])

    // Don't render anything if no query or no results (and not loading)
    if (!query || query.trim().length < 2) return null
    if (!loading && models.length === 0) return null

    return (
        <div className="mb-5 sm:mb-6 animate-[fadeUp_.3s_ease_both]">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2.5">
                <CpuChipIcon className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Browse by Model
                </span>
            </div>

            {/* Chip row — horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {loading ? (
                    // Skeleton chips
                    Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-9 w-28 rounded-full bg-gray-100 animate-pulse shrink-0"
                            style={{ animationDelay: `${i * 60}ms` }}
                        />
                    ))
                ) : (
                    models.map(model => (
                        <ModelChip key={model.id} model={model} />
                    ))
                )}
            </div>
        </div>
    )
}

// ── Individual model chip ─────────────────────────────────────────
function ModelChip({ model }: { model: ModelSuggestion }) {
    return (
        <Link
            href={model.href}
            className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-full
                bg-white border border-gray-200 hover:border-teal-400
                hover:bg-teal-50 hover:text-teal-800
                text-sm font-semibold text-gray-700
                transition-all duration-150 group"
        >
            {/* Chip content */}
            <span className="leading-none">{model.modelName}</span>

            {/* Listing count badge */}
            {model.listingCount > 0 && (
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500
                    group-hover:bg-teal-100 group-hover:text-teal-700
                    px-1.5 py-0.5 rounded-full transition-colors leading-none">
                    {model.listingCount}
                </span>
            )}
        </Link>
    )
}