'use client';

// ============================================
// DEVICE CARD — Used in featured grids,
// search results, and "Similar Devices"
// ============================================

import Link from 'next/link';
import Image from 'next/image';
import { Device } from '@/types/device'

const CONDITION_STYLES: Record<string, string> = {
    Excellent: 'bg-emerald-50 text-emerald-700',
    Good: 'bg-cyan-50 text-cyan-800',
    Fair: 'bg-amber-50 text-amber-700',
};

interface DeviceCardProps {
    device: Device;
    className?: string;
}

export default function DeviceCard({ device, className = '' }: DeviceCardProps) {
    const discount = Math.round((1 - device.price / device.originalPrice) * 100);

    return (
        // Clicking anywhere on the card navigates to the detail page
        <Link
            href={`/devices/${device.id}`}
            className={`group block bg-white rounded-2xl border border-gray-100 overflow-hidden 
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
                    className="w-[65%] h-[65%] object-contain group-hover:scale-105 transition-transform duration-300"
                    unoptimized /* remove once real CDN images are proxied */
                />
                {/* Verified badge */}
                {device.isVerified && (
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold 
                           px-2 py-1 rounded-full flex items-center gap-1">
                        ✓ Verified
                    </span>
                )}
                {/* Grade badge */}
                <span className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-teal-800 
                         text-[10px] font-bold px-2 py-1 rounded-full border border-teal-100">
                    Grade {device.grade}
                </span>
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
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${CONDITION_STYLES[device.conditionLabel]}`}>
                        {device.conditionLabel}
                    </span>
                </div>
            </div>
        </Link>
    );
}