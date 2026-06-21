'use client'

// src/components/devices/LazyDeviceCard.tsx
// ─────────────────────────────────────────────────────────────────
// Drop-in replacement for <DeviceCard> in grids.
//
// Defers mounting the real DeviceCard (and therefore its <Image>,
// WatchlistButton, etc.) until the card is ~300px from entering the
// viewport. Renders a same-sized skeleton until then, so the grid
// never reflows when the real card pops in.
//
// Usage: identical props to DeviceCard, plus an optional
// animationDelay for staggered grid entrance animations.
// ─────────────────────────────────────────────────────────────────

import { useInView } from '@/hooks/useInView'
import DeviceCard from './DeviceCard'
import type { Device } from '@/types/device'

interface LazyDeviceCardProps {
    device: Device
    initialSaved?: boolean
    /** Stagger delay (ms) for the fade-in animation — mirrors the
     *  `i * 40` pattern already used across the grids. */
    animationDelay?: number
}

export default function LazyDeviceCard({
    device,
    initialSaved = false,
    animationDelay = 0,
}: LazyDeviceCardProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '300px 0px' })

    return (
        <div ref={ref}>
            {inView ? (
                <div
                    className="animate-[fadeUp_.35s_ease_both]"
                    style={{ animationDelay: `${animationDelay}ms` }}
                >
                    <DeviceCard device={device} initialSaved={initialSaved} />
                </div>
            ) : (
                // Skeleton — matches DeviceCard's real footprint
                // (h-44 image + body) so the grid height never jumps.
                <div className="bg-white rounded-2xl border border-gray-100 h-64 sm:h-72 animate-pulse">
                    <div className="bg-gray-100 h-40 sm:h-44 rounded-t-2xl" />
                    <div className="p-3 sm:p-4 space-y-2">
                        <div className="bg-gray-100 h-3 rounded w-1/3" />
                        <div className="bg-gray-100 h-4 rounded w-3/4" />
                        <div className="bg-gray-100 h-3 rounded w-1/2" />
                    </div>
                </div>
            )}
        </div>
    )
}