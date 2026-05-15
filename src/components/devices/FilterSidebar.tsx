'use client';

// ============================================
// FILTER SIDEBAR — Device listing page filters
//
// Collapsible sections: Brand · Condition ·
// Price Range · Storage · RAM
//
// Props flow: devices/page.tsx owns the state
// and passes values + onChange here.
// ============================================

import { useState } from 'react';
import { ChevronDownIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import type { ListingFilters } from '@/services/deviceService';
import type { BrandOption } from '@/hooks/useFilterOptions';

// ── Static filter options ──────────────────────────────────────────
const CONDITION_OPTIONS = [
    { label: 'Like New', value: 'like_new', dot: 'bg-emerald-400' },
    { label: 'Excellent', value: 'excellent', dot: 'bg-teal-400' },
    { label: 'Good', value: 'good', dot: 'bg-blue-400' },
    { label: 'Fair', value: 'fair', dot: 'bg-amber-400' },
];

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB', '32GB'];

// ── Types ──────────────────────────────────────────────────────────

/** The subset of ListingFilters managed by this sidebar */
export interface SidebarFilters {
    condition: string;
    brand: string;
    storage: string;
    ram: string;
    minPrice: string;
    maxPrice: string;
}

interface FilterSidebarProps {
    filters: SidebarFilters;
    onChange: (key: keyof SidebarFilters, value: string) => void;
    onClearAll: () => void;
    brands: BrandOption[];
    brandsLoading: boolean;
}

// ── Accordion section wrapper ──────────────────────────────────────
function FilterSection({
    title,
    activeCount,
    children,
    defaultOpen = true,
}: {
    title: string;
    activeCount?: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-between w-full py-3.5 text-left group"
            >
                <span className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {title}
                    </span>
                    {/* Active filter badge */}
                    {activeCount ? (
                        <span className="w-4.5 h-4.5 min-w-[18px] px-1 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                            {activeCount}
                        </span>
                    ) : null}
                </span>
                <ChevronDownIcon
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200
                        ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Smooth accordion using max-height transition */}
            <div
                className={`overflow-hidden transition-all duration-250 ease-in-out
                    ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="pb-4">{children}</div>
            </div>
        </div>
    );
}

// ── Checkbox option row ────────────────────────────────────────────
function FilterOption({
    label,
    checked,
    onChange,
    dot,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
    dot?: string;
}) {
    return (
        <button
            onClick={onChange}
            className={`flex items-center gap-2.5 w-full text-left text-sm py-1.5 px-2 rounded-lg
                transition-all duration-150
                ${checked
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-normal'}`}
        >
            {/* Custom checkbox */}
            <span
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                    transition-all duration-150
                    ${checked
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-gray-300 bg-white'}`}
            >
                {checked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            {/* Optional condition color dot */}
            {dot && <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />}
            {label}
        </button>
    );
}

// ── Main Sidebar component ─────────────────────────────────────────
export default function FilterSidebar({
    filters,
    onChange,
    onClearAll,
    brands,
    brandsLoading,
}: FilterSidebarProps) {
    // Count total active filters to show "Clear all" button
    const activeCount = [
        filters.condition,
        filters.brand,
        filters.storage,
        filters.ram,
        filters.minPrice,
        filters.maxPrice,
    ].filter(Boolean).length;

    return (
        <aside className="w-[220px] shrink-0">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FunnelIcon className="w-4 h-4 text-teal-700" />
                    <span className="text-sm font-bold text-gray-800">Filters</span>
                    {activeCount > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {activeCount}
                        </span>
                    )}
                </div>

                {/* Clear all — only visible when filters are active */}
                {activeCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500
                            transition-colors duration-150 font-medium"
                    >
                        <XMarkIcon className="w-3 h-3" />
                        Clear all
                    </button>
                )}
            </div>

            {/* ── Filter Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 px-4">

                {/* ── BRAND ── */}
                <FilterSection
                    title="Brand"
                    activeCount={filters.brand ? 1 : 0}
                >
                    {brandsLoading ? (
                        // Skeleton while brands load
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-7 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : brands.length === 0 ? (
                        <p className="text-xs text-gray-400 py-1">No brands available</p>
                    ) : (
                        <div className="space-y-0.5">
                            {brands.map((b) => (
                                <FilterOption
                                    key={b.id}
                                    label={b.name}
                                    checked={filters.brand === b.slug}
                                    onChange={() =>
                                        onChange('brand', filters.brand === b.slug ? '' : b.slug)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </FilterSection>

                {/* ── CONDITION ── */}
                <FilterSection
                    title="Condition"
                    activeCount={filters.condition ? 1 : 0}
                >
                    <div className="space-y-0.5">
                        {CONDITION_OPTIONS.map((c) => (
                            <FilterOption
                                key={c.value}
                                label={c.label}
                                dot={c.dot}
                                checked={filters.condition === c.value}
                                onChange={() =>
                                    onChange(
                                        'condition',
                                        filters.condition === c.value ? '' : c.value
                                    )
                                }
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* ── PRICE RANGE ── */}
                <FilterSection
                    title="Price ($)"
                    activeCount={[filters.minPrice, filters.maxPrice].filter(Boolean).length}
                >
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => onChange('minPrice', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg pl-5 pr-2 py-2 text-sm
                                    focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition"
                            />
                        </div>
                        <span className="text-gray-300 text-sm shrink-0">–</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => onChange('maxPrice', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg pl-5 pr-2 py-2 text-sm
                                    focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition"
                            />
                        </div>
                    </div>
                </FilterSection>

                {/* ── STORAGE CAPACITY ── */}
                <FilterSection
                    title="Storage"
                    activeCount={filters.storage ? 1 : 0}
                    defaultOpen={false}
                >
                    <div className="flex flex-wrap gap-1.5">
                        {STORAGE_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                onClick={() =>
                                    onChange('storage', filters.storage === opt ? '' : opt)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
                                    ${filters.storage === opt
                                        ? 'bg-teal-700 border-teal-700 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </FilterSection>

                {/* ── RAM ── */}
                <FilterSection
                    title="RAM"
                    activeCount={filters.ram ? 1 : 0}
                    defaultOpen={false}
                >
                    <div className="flex flex-wrap gap-1.5">
                        {RAM_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                onClick={() =>
                                    onChange('ram', filters.ram === opt ? '' : opt)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
                                    ${filters.ram === opt
                                        ? 'bg-teal-700 border-teal-700 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </FilterSection>
            </div>
        </aside>
    );
}