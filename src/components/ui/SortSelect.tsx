'use client';

// src/components/ui/SortSelect.tsx
// ============================================
// SORT SELECT — tiny client component so the
// brand page (Server Component) can stay fully
// server-rendered while this one interactive
// element gets client-side routing.
//
// Why a separate file?
//   Server Components cannot pass event handlers
//   (onChange, onClick …) to the DOM. Extracting
//   just this <select> into 'use client' is the
//   minimal fix — the rest of the page stays SSR.
// ============================================

import { useRouter } from 'next/navigation'

interface SortOption {
    label: string
    value: string
}

interface SortSelectProps {
    /** Currently active sort value (e.g. "popular") */
    defaultValue: string
    /** Base path without query string, e.g. /categories/smartphones/apple */
    baseHref: string
    /** Active model filter to preserve when sort changes */
    modelFilter?: string
    options: SortOption[]
}

export default function SortSelect({
    defaultValue,
    baseHref,
    modelFilter,
    options,
}: SortSelectProps) {
    const router = useRouter()

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        // Rebuild query string, preserving the model filter if one is active
        const params = new URLSearchParams()
        if (modelFilter) params.set('model', modelFilter)
        // Only write sort to URL when it's not the default so URLs stay clean
        if (e.target.value && e.target.value !== 'popular') {
            params.set('sort', e.target.value)
        }
        const query = params.toString()
        router.push(query ? `${baseHref}?${query}` : baseHref)
    }

    return (
        <div className="relative">
            <select
                defaultValue={defaultValue}
                onChange={handleChange}
                className="appearance-none border border-gray-200 rounded-xl
                    px-4 py-2 pr-8 text-sm bg-white text-gray-700
                    focus:border-teal-400 outline-none cursor-pointer
                    hover:border-gray-300 transition-colors"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>

            {/* Chevron icon — pointer-events-none so clicks pass through to <select> */}
            <svg
                className="absolute right-2.5 top-1/2 -translate-y-1/2
                    w-4 h-4 text-gray-400 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="m6 9 6 6 6-6" />
            </svg>
        </div>
    )
}