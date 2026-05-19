'use client';

// src/components/devices/DeviceDetailClient.tsx
// ============================================
// DEVICE DETAIL PAGE
//
// Week 5 update: Reviews section replaced with
// the real <ReviewList> component. Stats are
// computed client-side from device.reviews so
// no extra prop is needed on Device.
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ShieldCheckIcon,
    TruckIcon,
    ArrowPathIcon,
    ChatBubbleLeftIcon,
    ShareIcon,
    FlagIcon,
    CheckCircleIcon,
    MagnifyingGlassPlusIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

import { Device, CheckStatus } from '@/types/device';
import type { ReviewStats } from '@/types/review';
import DeviceCard from '@/components/devices/DeviceCard';
import RatingStars from '@/components/layout/RatingStars';
import Footer from '@/components/layout/Footer';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import ReviewList from '@/components/reviews/ReviewList';

const CHECK_DOT: Record<CheckStatus, string> = {
    ok:   'bg-emerald-500',
    warn: 'bg-amber-400',
    bad:  'bg-red-500',
};

// ── Compute ReviewStats from the reviews array on the device ──────
// Called once per render — cheap since review counts are small.
function computeReviewStats(reviews: Device['reviews']): ReviewStats {
    const total = reviews.length;
    const empty: ReviewStats = {
        totalReviews: 0,
        averageOverall: 0,
        averageSeller: 0,
        averageAccuracy: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
    if (total === 0) return empty;

    const dist: ReviewStats['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumOverall = 0, sumSeller = 0, sumAccuracy = 0;

    for (const r of reviews) {
        sumOverall  += r.overallRating;
        sumSeller   += r.sellerRating;
        sumAccuracy += r.accuracyRating;
        const star = Math.min(5, Math.max(1, Math.round(r.overallRating))) as 1 | 2 | 3 | 4 | 5;
        dist[star]++;
    }

    const avg = (n: number) => Math.round((n / total) * 10) / 10;

    return {
        totalReviews: total,
        averageOverall:  avg(sumOverall),
        averageSeller:   avg(sumSeller),
        averageAccuracy: avg(sumAccuracy),
        distribution: dist,
    };
}

interface DetailPageProps {
    device: Device;
    similarDevices: Device[];
    initialSaved?: boolean;
}

export default function DetailPage({
    device,
    similarDevices,
    initialSaved = false,
}: DetailPageProps) {
    const [activeThumb,   setActiveThumb]   = useState(0);
    const [activeStorage, setActiveStorage] = useState(device.storage);
    const [toast,         setToast]         = useState<string | null>(null);

    const currentPrice = device.storagePrices[activeStorage] ?? device.price;
    const discount     = Math.round((1 - currentPrice / device.originalPrice) * 100);

    // Compute stats once — used by ReviewList
    const reviewStats = computeReviewStats(device.reviews);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2800);
    }

    return (
        <div className="min-h-screen bg-[#F4F2EE]">

            {/* ==================== BREADCRUMB ==================== */}
            <div className="max-w-[1160px] mx-auto px-6">
                <nav className="flex items-center gap-1.5 pt-4 pb-0 text-[12px] text-gray-400">
                    {[
                        { label: 'Home', href: '/' },
                        {
                            label: device.category || 'Devices',
                            href: device.categorySlug
                                ? `/categories/${device.categorySlug}`
                                : '/devices',
                        },
                        {
                            label: device.brand,
                            href: device.brandSlug && device.categorySlug
                                ? `/categories/${device.categorySlug}/${device.brandSlug}`
                                : '/devices',
                        },
                    ].map(({ label, href }) => (
                        <span key={label} className="flex items-center gap-1.5">
                            <Link href={href} className="hover:text-teal-700 transition-colors">
                                {label}
                            </Link>
                            <ChevronRightIcon className="w-3 h-3" />
                        </span>
                    ))}
                    <span className="text-gray-600 font-medium">
                        {device.model} {device.storage}
                    </span>
                </nav>

                {/* ==================== MAIN GRID ==================== */}
                <div className="grid grid-cols-[1fr_400px] gap-8 py-6 pb-16 items-start">

                    {/* ===== LEFT COLUMN ===== */}
                    <div className="flex flex-col gap-6">

                        {/* ── IMAGE GALLERY ── */}
                        <div className="flex gap-4 animate-[fadeUp_.5s_ease_both_.05s]">
                            <div className="flex flex-col gap-2.5">
                                {device.images.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveThumb(i)}
                                        className={`w-[70px] h-[70px] rounded-xl bg-white border-2 overflow-hidden
                                            transition-all duration-150
                                            ${activeThumb === i
                                                ? 'border-teal-600 shadow-md'
                                                : 'border-gray-200 hover:border-teal-400'}`}
                                    >
                                        <Image src={src} alt={`View ${i + 1}`} width={70} height={70}
                                            className="w-full h-full object-contain p-1" unoptimized />
                                    </button>
                                ))}
                            </div>

                            <div className="relative flex-1 aspect-square rounded-3xl bg-white border
                                border-gray-100 shadow-md flex items-center justify-center
                                overflow-hidden group">
                                {device.isVerified && (
                                    <span className="absolute top-4 left-4 z-10 bg-emerald-500 text-white
                                        text-[11px] font-bold px-3 py-1.5 rounded-full
                                        flex items-center gap-1.5 animate-pulse">
                                        <CheckCircleSolid className="w-3.5 h-3.5" />
                                        VERIFIED
                                    </span>
                                )}
                                <Image
                                    src={device.images[activeThumb]}
                                    alt={device.fullName}
                                    width={500} height={500}
                                    className="w-[75%] h-[75%] object-contain
                                        group-hover:scale-105 transition-transform duration-350"
                                    unoptimized
                                />
                                <button
                                    className="absolute bottom-4 right-4 w-9 h-9 bg-white/80
                                        backdrop-blur-sm rounded-lg border border-gray-200
                                        flex items-center justify-center hover:bg-white
                                        hover:shadow-sm transition-all"
                                    aria-label="Zoom image"
                                >
                                    <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* ── CONDITION REPORT ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                            overflow-hidden animate-[fadeUp_.5s_ease_both_.15s]">
                            <div className="flex items-center justify-between px-6 py-4
                                border-b border-gray-100">
                                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <CheckCircleIcon className="w-4 h-4 text-teal-600" />
                                    Condition Report
                                </h2>
                                <span className="text-xs text-gray-400">
                                    Inspected · {device.inspectedDate}
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="relative w-16 h-16 shrink-0">
                                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                            <circle cx="32" cy="32" r="28" fill="none"
                                                stroke="#E5E7EB" strokeWidth="6" />
                                            <circle cx="32" cy="32" r="28" fill="none"
                                                stroke="#059669" strokeWidth="6"
                                                strokeDasharray={`${2 * Math.PI * 28 * 0.85} ${2 * Math.PI * 28}`}
                                                strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center
                                            justify-center font-mono text-lg font-semibold
                                            text-emerald-600">
                                            {device.grade}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-0.5">
                                            {device.conditionLabel} Condition
                                        </h3>
                                        <p className="text-sm text-gray-400 leading-snug">
                                            Minimal signs of use. Fully functional. Cleaned &amp; tested.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {device.conditionChecks.map((check, i) => (
                                        <div key={i}
                                            className="flex items-center gap-2 text-[13px]
                                                text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5">
                                            <span className={`w-2 h-2 rounded-full shrink-0
                                                ${CHECK_DOT[check.status]}`} />
                                            {check.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── FULL SPECIFICATIONS ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                            overflow-hidden animate-[fadeUp_.5s_ease_both_.25s]">
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                                <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                                <h2 className="text-sm font-bold text-gray-900">
                                    Full Specifications
                                </h2>
                            </div>
                            <table className="w-full">
                                <tbody>
                                    {device.specs.map((spec, i) => (
                                        <tr key={i}
                                            className={`border-b border-gray-50 last:border-b-0
                                                ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                            <td className="px-6 py-3 text-[12px] font-medium
                                                text-gray-400 font-mono tracking-wide w-[36%]">
                                                {spec.label}
                                            </td>
                                            <td className={`px-6 py-3 text-[13px] font-medium
                                                ${spec.highlighted
                                                    ? 'text-emerald-600 font-semibold'
                                                    : 'text-gray-800'}`}>
                                                {spec.value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── REVIEWS — wired to real data via ReviewList ── */}
                        <div className="animate-[fadeUp_.5s_ease_both_.35s]">
                            <ReviewList
                                reviews={device.reviews}
                                stats={reviewStats}
                            />
                        </div>
                    </div>

                    {/* ===== RIGHT COLUMN (STICKY) ===== */}
                    <div className="flex flex-col gap-4 sticky top-[78px]">

                        {/* ── BUY CARD ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-7
                            animate-[fadeUp_.5s_ease_both_.1s]">
                            <h1 className="text-[15px] font-semibold text-gray-900 leading-snug mb-0.5">
                                {device.fullName}
                            </h1>
                            <p className="text-xs text-gray-400 mb-5">
                                Grade {device.grade} · {activeStorage} · Unlocked · IMEI Clean
                            </p>

                            {/* Price + stars row */}
                            <div className="flex items-start justify-between mb-1.5">
                                <div className="flex items-baseline gap-2.5">
                                    <span className="text-[32px] font-bold text-gray-900
                                        leading-none tracking-tight">
                                        ${currentPrice}
                                    </span>
                                    <span className="text-base text-gray-400 line-through">
                                        ${device.originalPrice}
                                    </span>
                                    <span className="text-xs font-bold bg-amber-100 text-amber-600
                                        px-2 py-0.5 rounded">
                                        -{discount}%
                                    </span>
                                </div>

                                {/* Mini rating summary */}
                                {device.totalReviews > 0 && (
                                    <div className="flex flex-col items-end gap-0.5">
                                        <RatingStars rating={device.averageRating} size="sm" />
                                        <span className="text-[10px] text-gray-400">
                                            {device.averageRating} ({device.totalReviews})
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-400 mb-5">
                                Free shipping · Arrives in {device.shippingDays}
                            </p>

                            {/* Escrow banner */}
                            <div className="flex items-start gap-3 bg-emerald-50 border
                                border-emerald-100 rounded-xl p-3.5 mb-5">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-900 mb-0.5">
                                        Buyer Protection — Escrow Secured
                                    </p>
                                    <p className="text-xs text-emerald-700 leading-relaxed">
                                        Payment held safely until you inspect and approve the
                                        device within 5 days.
                                    </p>
                                </div>
                            </div>

                            {/* Storage selector */}
                            <p className="text-xs font-semibold text-gray-600 mb-2">Storage</p>
                            <div className="flex gap-2 mb-5">
                                {device.availableStorage.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setActiveStorage(opt)}
                                        className={`px-3.5 py-2 rounded-lg border text-xs font-medium
                                            transition-all
                                            ${activeStorage === opt
                                                ? 'bg-teal-800 border-teal-800 text-white font-semibold'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>

                            {/* Buy Now CTA */}
                            <Link
                                href={`/checkout/${device.id}`}
                                className="w-full h-[52px] bg-teal-800 hover:bg-teal-700 text-white
                                    font-bold rounded-xl flex items-center justify-center gap-2
                                    text-[15px] transition-all hover:-translate-y-0.5
                                    hover:shadow-lg mb-2.5"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                Buy Now — ${currentPrice}
                            </Link>

                            {/* Make Offer */}
                            <button
                                onClick={() => showToast('Offer sent to seller!')}
                                className="w-full h-12 border-2 border-teal-800 text-teal-800
                                    font-semibold rounded-xl flex items-center justify-center
                                    gap-2 text-sm hover:bg-cyan-50 transition-colors"
                            >
                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                Make an Offer
                            </button>

                            {/* Secondary actions */}
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                <WatchlistButton
                                    deviceId={device.id}
                                    initialSaved={initialSaved}
                                    variant="pill"
                                    showToast={showToast}
                                    className="col-span-1"
                                />
                                <button
                                    onClick={() => showToast('Link copied!')}
                                    className="h-10 bg-gray-50 hover:bg-gray-100 border border-gray-100
                                        rounded-lg text-xs font-semibold text-gray-500
                                        flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <ShareIcon className="w-3.5 h-3.5" />
                                    Share
                                </button>
                                <button
                                    onClick={() => showToast('Report submitted. Thank you.')}
                                    className="h-10 bg-gray-50 hover:bg-gray-100 border border-gray-100
                                        rounded-lg text-xs font-semibold text-gray-500
                                        flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <FlagIcon className="w-3.5 h-3.5" />
                                    Report
                                </button>
                            </div>

                            <div className="mt-5 flex flex-col gap-2">
                                {[
                                    { icon: TruckIcon,       text: `Free shipping via ${device.shippingProvider}` },
                                    { icon: ShieldCheckIcon, text: '5-day inspection window' },
                                    { icon: ArrowPathIcon,   text: '30-day hassle-free returns' },
                                ].map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center gap-2.5 text-xs text-gray-500">
                                        <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── SELLER CARD ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6
                            animate-[fadeUp_.5s_ease_both_.2s]">
                            <div className="flex items-center gap-3.5 mb-4">
                                <div className={`w-[52px] h-[52px] rounded-full
                                    bg-gradient-to-br ${device.seller.avatarColor}
                                    flex items-center justify-center text-white font-bold
                                    text-base shrink-0`}>
                                    {device.seller.initials}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[15px] font-bold text-gray-900">
                                            {device.seller.name}
                                        </span>
                                        {device.seller.isVerified && (
                                            <span className="flex items-center gap-1 text-[9px]
                                                font-bold uppercase tracking-widest bg-emerald-50
                                                text-emerald-700 px-1.5 py-0.5 rounded">
                                                <CheckCircleSolid className="w-2.5 h-2.5" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Member since {device.seller.memberSince} · {device.seller.location}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                    { val: device.seller.rating,       label: 'Rating'   },
                                    { val: device.seller.totalSales,   label: 'Sales'    },
                                    { val: device.seller.responseTime, label: 'Response' },
                                ].map(({ val, label }) => (
                                    <div key={label} className="text-center py-3 bg-gray-50 rounded-xl">
                                        <p className="text-[17px] font-bold text-gray-900">{val}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => showToast('Message sent to seller!')}
                                className="w-full h-11 border-2 border-gray-200 hover:border-teal-400
                                    text-gray-600 hover:text-teal-700 font-semibold rounded-xl
                                    flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                Message Seller
                            </button>
                        </div>

                        {/* ── IMEI VERIFICATION CARD ── */}
                        <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl
                            p-6 text-white animate-[fadeUp_.5s_ease_both_.3s]">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheckIcon className="w-4 h-4" />
                                <h3 className="text-sm font-bold">Device Verification</h3>
                            </div>
                            <p className="text-xs text-teal-200 mb-4">
                                IMEI: 35•••••••••1847 — verified by Go2Hand
                            </p>
                            <div className="flex flex-col gap-2">
                                {[
                                    'Not blacklisted / stolen',
                                    'iCloud lock removed',
                                    'Carrier unlocked (all SIM)',
                                    'Serial number matches',
                                ].map((item) => (
                                    <div key={item}
                                        className="flex items-center gap-2 text-sm text-teal-100">
                                        <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==================== SIMILAR DEVICES ==================== */}
                {similarDevices.length > 0 && (
                    <div className="pb-16">
                        <h2 className="text-xl font-bold text-gray-900 mb-5">
                            Similar Devices You May Like
                        </h2>
                        <div className="grid grid-cols-4 gap-4">
                            {similarDevices.map((d) => (
                                <DeviceCard key={d.id} device={d} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-7 right-7 z-50 bg-gray-900 text-white px-5 py-3.5
                    rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium
                    animate-[fadeUp_.3s_ease_both]">
                    <CheckCircleSolid className="w-5 h-5 text-emerald-400" />
                    {toast}
                </div>
            )}
        </div>
    );
}