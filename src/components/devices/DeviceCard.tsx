'use client';

// ============================================
// DEVICE CARD — Used in featured grids,
// search results, and "Similar Devices"
//
// Week 4 update: Added WatchlistButton overlay
// that appears on image hover. Uses stopPropagation
// so clicking ♡ never triggers the card navigation.
// ============================================

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Device } from '@/types/device';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

const CONDITION_STYLES: Record<string, string> = {
    Excellent: 'bg-emerald-50 text-emerald-700',
    Good:      'bg-cyan-50 text-cyan-800',
    Fair:      'bg-amber-50 text-amber-700',
};

interface DeviceCardProps {
    device: Device;
    className?: string;
    /** Pre-seeded saved state so heart is filled immediately on load */
    initialSaved?: boolean;
}

export default function DeviceCard({
    device,
    className = '',
    initialSaved = false,
}: DeviceCardProps) {
    // Toast lives here so we don't need a global store
    const [toast, setToast] = useState<string | null>(null);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2400);
    }

    return (
        <>
            <Link
                href={`/devices/${device.id}`}
                className={`group block relative bg-white rounded-2xl border border-gray-100 overflow-hidden
                    shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-250
                    cursor-pointer ${className}`}
            >
                {/* ── Device Image ── */}
                <div className="relative bg-gray-50 h-44 flex items-center justify-center overflow-hidden">
                    <Image
                        src={device.images[0]}
                        alt={device.fullName}
                        width={200}
                        height={200}
                        className="w-[65%] h-[65%] object-contain
                            group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                    />

                    {/* Verified badge — bottom-left */}
                    {device.isVerified && (
                        <span className="absolute bottom-3 left-3 bg-emerald-500 text-white
                            text-[10px] font-bold px-2 py-0.5 rounded-full
                            flex items-center gap-1 z-10">
                            <CheckCircleIcon className="w-2.5 h-2.5" />
                            Verified
                        </span>
                    )}

                    {/* Grade badge — top-left */}
                    <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm
                        text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full
                        border border-teal-100 z-10">
                        Grade {device.grade}
                    </span>

                    {/* ── Heart / Watchlist button — top-right ──
                        Visible only on hover (opacity-0 → opacity-100 via group).
                        stopPropagation inside WatchlistButton prevents card navigation. */}
                    <div className="absolute top-3 right-3 z-10
                        opacity-0 group-hover:opacity-100
                        translate-y-1 group-hover:translate-y-0
                        transition-all duration-200">
                        <WatchlistButton
                            deviceId={device.id}
                            initialSaved={initialSaved}
                            variant="icon"
                            size="sm"
                            showToast={showToast}
                        />
                    </div>
                </div>

                {/* ── Card Body ── */}
                <div className="p-4">
                    {/* Brand */}
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">
                        {device.brand}
                    </p>
                    {/* Name */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">
                        {device.model}
                    </h3>
                    {/* Subtitle */}
                    <p className="text-[12px] text-gray-400 mb-3">
                        {device.storage} · {device.color} · Grade {device.grade}
                    </p>

                    {/* Price row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[17px] font-bold text-gray-900">
                                ${device.price}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                                ${device.originalPrice}
                            </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md
                            ${CONDITION_STYLES[device.conditionLabel]}`}>
                            {device.conditionLabel}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Per-card toast (appears bottom-right corner) */}
            {toast && (
                <div className="fixed bottom-7 right-7 z-50 bg-gray-900 text-white
                    px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium
                    animate-[fadeUp_.3s_ease_both] pointer-events-none">
                    {toast}
                </div>
            )}
        </>
    );
}