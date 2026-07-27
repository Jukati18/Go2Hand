'use client';

// src/components/layout/SearchBar.tsx
// ─────────────────────────────────────────────────────────────────
// SEARCH BAR — Autocomplete dropdown with three result tiers
//
// Tier 1: MODEL SUGGESTIONS  — from device_models table
//   Shows brand + model name + listing count chip
//   Clicking routes to /categories/[cat]/[brand]?model=...
//
// Tier 2: LISTING SUGGESTIONS — individual product listings
//   Same as before: thumbnail + title + price
//
// Tier 3: Recent searches (when input is empty)
//
// Keyboard nav: ↑ ↓ Enter Escape (all tiers included in index)
// ─────────────────────────────────────────────────────────────────

import {
    useState, useEffect, useRef,
    useCallback, KeyboardEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    MagnifyingGlassIcon,
    ClockIcon,
    XMarkIcon,
    ArrowRightIcon,
    CpuChipIcon,
} from '@heroicons/react/24/outline'
import {
    getCombinedSuggestions,
    getRecentSearches,
    saveRecentSearch,
    removeRecentSearch,
    type SearchSuggestion,
    type ModelSuggestion,
} from '@/services/searchService'

// ── Format USD price ───────────────────────────────────────────────
function fmt(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

// ── Highlight matching text in a suggestion label ──────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
        <span>
            {text.slice(0, idx)}
            <mark className="bg-teal-100 text-teal-900 rounded px-0.5 not-italic font-semibold">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </span>
    )
}

// ── Loading skeleton row ───────────────────────────────────────────
function SuggestionSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
    )
}

// ── Model suggestion row (Tier 1) ─────────────────────────────────
function ModelRow({
    model,
    query,
    isActive,
    onClick,
}: {
    model: ModelSuggestion
    query: string
    isActive: boolean
    onClick: () => void
}) {
    return (
        <button
            role="option"
            aria-selected={isActive}
            onClick={onClick}
            className={`flex items-center gap-3 w-full text-left px-4 py-2.5
                transition-colors duration-100
                ${isActive ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
        >
            {/* Icon — chip motif for "model" concept */}
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100
                flex items-center justify-center shrink-0">
                <CpuChipIcon className="w-4 h-4 text-teal-600" />
            </div>

            {/* Name + brand */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate leading-snug font-medium">
                    <HighlightMatch text={model.modelName} query={query} />
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{model.brandName}</p>
            </div>

            {/* Listing count pill */}
            {model.listingCount > 0 && (
                <span className="shrink-0 text-[10px] font-bold bg-teal-50 border border-teal-200
                    text-teal-700 px-2 py-0.5 rounded-full">
                    {model.listingCount} listing{model.listingCount !== 1 ? 's' : ''}
                </span>
            )}
        </button>
    )
}

// ── Section heading inside dropdown ───────────────────────────────
function DropdownSection({ label }: { label: string }) {
    return (
        <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {label}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function SearchBar() {
    const router = useRouter()

    // ── State ──────────────────────────────────────────────────────
    const [input,       setInput]       = useState('')
    const [isOpen,      setIsOpen]      = useState(false)
    const [models,      setModels]      = useState<ModelSuggestion[]>([])
    const [listings,    setListings]    = useState<SearchSuggestion[]>([])
    const [recents,     setRecents]     = useState<string[]>([])
    const [fetching,    setFetching]    = useState(false)
    const [activeIdx,   setActiveIdx]   = useState(-1)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef     = useRef<HTMLInputElement>(null)

    // ── Load recents when dropdown opens ──────────────────────────
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isOpen) setRecents(getRecentSearches())
    }, [isOpen])

    // ── Debounced combined fetch ───────────────────────────────────
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveIdx(-1)

        if (input.trim().length < 2) {
            setModels([])
            setListings([])
            setFetching(false)
            return
        }

        setFetching(true)
        const timer = setTimeout(async () => {
            const { models: m, listings: l } = await getCombinedSuggestions(input)
            setModels(m)
            setListings(l)
            setFetching(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [input])

    // ── Click outside → close ─────────────────────────────────────
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setActiveIdx(-1)
            }
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [])

    // ── Navigate to a search results page ─────────────────────────
    const submitSearch = useCallback((term: string) => {
        if (!term.trim()) return
        saveRecentSearch(term.trim())
        setInput(term.trim())
        setIsOpen(false)
        setActiveIdx(-1)
        router.push(`/devices?q=${encodeURIComponent(term.trim())}`)
    }, [router])

    // ── Navigate to a specific listing ────────────────────────────
    const goToListing = useCallback((s: SearchSuggestion) => {
        saveRecentSearch(s.title)
        setInput(s.title)
        setIsOpen(false)
        setActiveIdx(-1)
        router.push(s.href)
    }, [router])

    // ── Navigate to a model page ───────────────────────────────────
    const goToModel = useCallback((m: ModelSuggestion) => {
        saveRecentSearch(m.modelName)
        setInput(m.modelName)
        setIsOpen(false)
        setActiveIdx(-1)
        router.push(m.href)
    }, [router])

    // ── Remove a recent search ────────────────────────────────────
    const handleRemoveRecent = useCallback((e: React.MouseEvent, term: string) => {
        e.stopPropagation()
        setRecents(removeRecentSearch(term))
    }, [])

    // ── Build flat index for keyboard navigation ───────────────────
    // Layout:
    //   0 … recents.length-1              → recent rows
    //   recents.length … +models.length-1 → model rows
    //   … +listings.length-1             → listing rows
    //   last                              → "see all results"
    const hasQuery     = input.trim().length >= 2
    const recentCount  = hasQuery ? 0 : recents.length
    const modelCount   = hasQuery ? models.length : 0
    const listingCount = hasQuery ? listings.length : 0
    const hasSeeAll    = hasQuery && (models.length > 0 || listings.length > 0)
    const totalItems   = recentCount + modelCount + listingCount + (hasSeeAll ? 1 : 0)

    function getRowType(idx: number): 'recent' | 'model' | 'listing' | 'seeall' {
        if (idx < recentCount)              return 'recent'
        if (idx < recentCount + modelCount) return 'model'
        if (idx < recentCount + modelCount + listingCount) return 'listing'
        return 'seeall'
    }
    function getRowDataIndex(idx: number, type: 'recent' | 'model' | 'listing'): number {
        if (type === 'recent')  return idx
        if (type === 'model')   return idx - recentCount
        return idx - recentCount - modelCount
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (!isOpen) {
            if (e.key === 'ArrowDown') { setIsOpen(true); return }
            if (e.key === 'Enter') { submitSearch(input); return }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setActiveIdx(i => (i + 1) % (totalItems || 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setActiveIdx(i => (i <= 0 ? totalItems - 1 : i - 1))
                break
            case 'Enter':
                e.preventDefault()
                if (activeIdx === -1) {
                    submitSearch(input)
                } else {
                    const type = getRowType(activeIdx)
                    if (type === 'recent') {
                        submitSearch(recents[getRowDataIndex(activeIdx, 'recent')])
                    } else if (type === 'model') {
                        goToModel(models[getRowDataIndex(activeIdx, 'model')])
                    } else if (type === 'listing') {
                        goToListing(listings[getRowDataIndex(activeIdx, 'listing')])
                    } else {
                        submitSearch(input)
                    }
                }
                break
            case 'Escape':
                setIsOpen(false)
                setActiveIdx(-1)
                inputRef.current?.blur()
                break
        }
    }

    // ── Dropdown visibility ────────────────────────────────────────
    const showRecents     = isOpen && recents.length > 0 && !hasQuery
    const showSuggestions = isOpen && hasQuery
    const showDropdown    = showRecents || showSuggestions

    const hasNoResults    = hasQuery && !fetching && models.length === 0 && listings.length === 0

    return (
        <div ref={containerRef} className="relative flex-1 max-w-[460px]">

            {/* ── Input ── */}
            <div
                className={`flex items-center gap-2.5 bg-white border rounded-full
                    px-4 py-2.5 transition-all duration-200
                    ${isOpen
                        ? 'border-teal-500 ring-2 ring-teal-100 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'}`}
            >
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setIsOpen(true) }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search devices, models, brands…"
                    className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                />

                {/* Clear × */}
                {input && (
                    <button
                        onClick={() => { setInput(''); setModels([]); setListings([]); inputRef.current?.focus() }}
                        className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                        aria-label="Clear search"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ── Dropdown ── */}
            {showDropdown && (
                <div
                    className="absolute top-[calc(100%+8px)] left-0 right-0 z-50
                        bg-white rounded-2xl shadow-2xl border border-gray-100
                        overflow-hidden
                        animate-[fadeDown_.15s_ease_both]"
                    role="listbox"
                >
                    {/* ─ RECENT SEARCHES ─ */}
                    {showRecents && (
                        <>
                            <DropdownSection label="Recent Searches" />
                            {recents.map((term, i) => (
                                <button
                                    key={term}
                                    role="option"
                                    aria-selected={activeIdx === i}
                                    onClick={() => submitSearch(term)}
                                    className={`flex items-center gap-3 w-full text-left px-4 py-2.5
                                        transition-colors duration-100 group
                                        ${activeIdx === i ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                                >
                                    <ClockIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="flex-1 text-sm text-gray-700">{term}</span>
                                    <span
                                        role="button"
                                        onClick={(e) => handleRemoveRecent(e, term)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300
                                            hover:text-gray-500 transition-all p-1 rounded"
                                        aria-label={`Remove "${term}" from recent searches`}
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </span>
                                </button>
                            ))}
                            <div className="h-px bg-gray-100 mx-4 my-1" />
                        </>
                    )}

                    {/* ─ LIVE SUGGESTIONS ─ */}
                    {showSuggestions && (
                        <>
                            {/* Loading skeletons */}
                            {fetching && (
                                <>
                                    <DropdownSection label="Models" />
                                    <SuggestionSkeleton />
                                    <SuggestionSkeleton />
                                    <DropdownSection label="Listings" />
                                    <SuggestionSkeleton />
                                    <SuggestionSkeleton />
                                </>
                            )}

                            {/* MODEL suggestions */}
                            {!fetching && models.length > 0 && (
                                <>
                                    <DropdownSection label="Device Models" />
                                    {models.map((m, i) => {
                                        const rowIdx = recentCount + i
                                        return (
                                            <ModelRow
                                                key={m.id}
                                                model={m}
                                                query={input}
                                                isActive={activeIdx === rowIdx}
                                                onClick={() => goToModel(m)}
                                            />
                                        )
                                    })}
                                </>
                            )}

                            {/* LISTING suggestions */}
                            {!fetching && listings.length > 0 && (
                                <>
                                    <div className={`h-px bg-gray-100 mx-4 ${models.length > 0 ? 'mt-1' : ''}`} />
                                    <DropdownSection label="Listings" />
                                    {listings.map((s, i) => {
                                        const rowIdx = recentCount + modelCount + i
                                        return (
                                            <button
                                                key={s.id}
                                                role="option"
                                                aria-selected={activeIdx === rowIdx}
                                                onClick={() => goToListing(s)}
                                                className={`flex items-center gap-3 w-full text-left px-4 py-2.5
                                                    transition-colors duration-100
                                                    ${activeIdx === rowIdx ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100
                                                    flex items-center justify-center shrink-0 overflow-hidden">
                                                    {s.imageUrl ? (
                                                        <Image
                                                            src={s.imageUrl}
                                                            alt={s.title}
                                                            width={36}
                                                            height={36}
                                                            sizes="36px"
                                                            className="w-full h-full object-contain p-0.5"
                                                        />
                                                    ) : (
                                                        <span className="text-base">📱</span>
                                                    )}
                                                </div>

                                                {/* Title + brand */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 truncate leading-snug">
                                                        <HighlightMatch text={s.title} query={input} />
                                                    </p>
                                                    {s.brand && (
                                                        <p className="text-[11px] text-gray-400 mt-0.5">{s.brand}</p>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                {s.price > 0 && (
                                                    <span className="text-sm font-semibold text-teal-700 shrink-0">
                                                        {fmt(s.price)}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </>
                            )}

                            {/* No results */}
                            {hasNoResults && (
                                <div className="px-4 py-5 text-center">
                                    <p className="text-sm text-gray-500 mb-1">
                                        No results for &quot;<span className="font-semibold text-gray-700">{input}</span>&quot;
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Try searching by brand, model, or specs
                                    </p>
                                </div>
                            )}

                            {/* ── "See all results" footer ── */}
                            {!fetching && !hasNoResults && (
                                <>
                                    <div className="h-px bg-gray-100 mx-4" />
                                    <button
                                        role="option"
                                        aria-selected={activeIdx === totalItems - 1}
                                        onClick={() => submitSearch(input)}
                                        className={`flex items-center justify-between w-full px-4 py-3
                                            text-sm font-semibold transition-colors duration-100
                                            ${activeIdx === totalItems - 1
                                                ? 'bg-teal-50 text-teal-800'
                                                : 'text-teal-700 hover:bg-gray-50'}`}
                                    >
                                        <span>
                                            See all results for &quot;
                                            <span className="text-teal-900">{input}</span>
                                            &quot;
                                        </span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}