'use client';

// ============================================
// SEARCH BAR — Autocomplete dropdown
//
// Features:
//  • Debounced Supabase suggestions (300 ms)
//  • Recent searches from localStorage
//  • Device thumbnails + brand + price in results
//  • Full keyboard nav: ↑ ↓ Enter Escape
//  • Loading skeletons while fetching
//  • Click-outside / Escape closes dropdown
//  • "See all results for …" footer link
// ============================================

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
} from '@heroicons/react/24/outline'
import {
    getSearchSuggestions,
    getRecentSearches,
    saveRecentSearch,
    removeRecentSearch,
    type SearchSuggestion,
} from '@/services/searchService'

// ── Helpers ───────────────────────────────────────────────────────
function fmt(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0,
    }).format(n)
}

// Highlight the matching portion of a suggestion title
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

// ── Skeleton row ─────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────
export default function SearchBar() {
    const router = useRouter()

    // ── State ──────────────────────────────────────────────────────
    const [input, setInput] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
    const [recents, setRecents] = useState<string[]>([])
    const [fetching, setFetching] = useState(false)
    // -1 = nothing, 0..recents.length-1 = recent row,
    // recents.length.. = suggestion rows, last = "see all"
    const [activeIdx, setActiveIdx] = useState(-1)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // ── Load recent searches when dropdown opens ──────────────────
    useEffect(() => {
        if (isOpen) setRecents(getRecentSearches())
    }, [isOpen])

    // ── Debounced suggestion fetch ────────────────────────────────
    useEffect(() => {
        setActiveIdx(-1)

        if (input.trim().length < 2) {
            setSuggestions([])
            setFetching(false)
            return
        }

        setFetching(true)
        const timer = setTimeout(async () => {
            const results = await getSearchSuggestions(input)
            setSuggestions(results)
            setFetching(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [input])

    // ── Click outside → close ─────────────────────────────────────
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
                setActiveIdx(-1)
            }
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [])

    // ── Navigate to a search term ─────────────────────────────────
    const submitSearch = useCallback(
        (term: string) => {
            if (!term.trim()) return
            saveRecentSearch(term.trim())
            setInput(term.trim())
            setIsOpen(false)
            setActiveIdx(-1)
            router.push(`/devices?q=${encodeURIComponent(term.trim())}`)
        },
        [router]
    )

    // ── Navigate to a specific device ────────────────────────────
    const goToDevice = useCallback(
        (suggestion: SearchSuggestion) => {
            saveRecentSearch(suggestion.title)
            setInput(suggestion.title)
            setIsOpen(false)
            setActiveIdx(-1)
            router.push(suggestion.href)
        },
        [router]
    )

    // ── Remove a recent search ────────────────────────────────────
    const handleRemoveRecent = useCallback(
        (e: React.MouseEvent, term: string) => {
            e.stopPropagation()
            setRecents(removeRecentSearch(term))
        },
        []
    )

    // ── Keyboard navigation ───────────────────────────────────────
    // Index layout:
    //   0 … recents.length-1       → recent search rows
    //   recents.length … recents.length+suggestions.length-1 → suggestion rows
    //   recents.length+suggestions.length                    → "See all results"
    const totalItems =
        recents.length +
        (input.trim().length >= 2 ? suggestions.length : 0) +
        (input.trim().length >= 2 ? 1 : 0) // "see all" row

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (!isOpen) {
            if (e.key === 'ArrowDown') { setIsOpen(true); return }
            if (e.key === 'Enter') { submitSearch(input); return }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setActiveIdx((i) => (i + 1) % (totalItems || 1))
                break

            case 'ArrowUp':
                e.preventDefault()
                setActiveIdx((i) => (i <= 0 ? totalItems - 1 : i - 1))
                break

            case 'Enter':
                e.preventDefault()
                if (activeIdx === -1) {
                    // No item highlighted → submit current input as search
                    submitSearch(input)
                } else if (activeIdx < recents.length) {
                    // A recent search row
                    submitSearch(recents[activeIdx])
                } else {
                    const sugIdx = activeIdx - recents.length
                    if (sugIdx < suggestions.length) {
                        goToDevice(suggestions[sugIdx])
                    } else {
                        // "See all results" row
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

    // ── Dropdown visibility logic ─────────────────────────────────
    const showRecents = isOpen && recents.length > 0 && input.trim().length < 2
    const showSuggestions = isOpen && input.trim().length >= 2
    const showDropdown = showRecents || showSuggestions

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
                    onChange={(e) => {
                        setInput(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search devices, models, brands…"
                    className="w-full text-sm text-gray-800 bg-transparent outline-none
                        placeholder:text-gray-400"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                />

                {/* Clear input × */}
                {input && (
                    <button
                        onClick={() => {
                            setInput('')
                            setSuggestions([])
                            inputRef.current?.focus()
                        }}
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

                    {/* Recent searches — shown when input is empty */}
                    {showRecents && (
                        <>
                            <div className="px-4 pt-3 pb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Recent Searches
                                </span>
                            </div>
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
                                    {/* Remove recent */}
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

                    {/* Live suggestions */}
                    {showSuggestions && (
                        <>
                            {/* Suggestions header */}
                            <div className="px-4 pt-3 pb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Suggestions
                                </span>
                            </div>

                            {/* Loading skeletons */}
                            {fetching && (
                                <>
                                    <SuggestionSkeleton />
                                    <SuggestionSkeleton />
                                    <SuggestionSkeleton />
                                </>
                            )}

                            {/* Suggestion rows */}
                            {!fetching && suggestions.map((s, i) => {
                                const rowIdx = recents.length + i
                                return (
                                    <button
                                        key={s.id}
                                        role="option"
                                        aria-selected={activeIdx === rowIdx}
                                        onClick={() => goToDevice(s)}
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
                                                    className="w-full h-full object-contain p-0.5"
                                                    unoptimized
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

                            {/* No results */}
                            {!fetching && suggestions.length === 0 && (
                                <div className="px-4 py-4 text-sm text-gray-400 text-center">
                                    No devices found for &quot;{input}&quot;
                                </div>
                            )}

                            {/* ── "See all results" footer ── */}
                            {!fetching && suggestions.length > 0 && (
                                <>
                                    <div className="h-px bg-gray-100 mx-4" />
                                    <button
                                        role="option"
                                        aria-selected={activeIdx === recents.length + suggestions.length}
                                        onClick={() => submitSearch(input)}
                                        className={`flex items-center justify-between w-full px-4 py-3
                                            text-sm font-semibold transition-colors duration-100
                                            ${activeIdx === recents.length + suggestions.length
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