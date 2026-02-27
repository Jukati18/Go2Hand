'use client';
// src/app/pages/HomePage.tsx
// ─── CHANGE: removed `import { FEATURED_DEVICES }` ──────────────
//             now fetches from Supabase via useEffect

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DeviceCard from '@/components/devices/DeviceCard';
import { getFeaturedDevices } from '@/lib/deviceService';
import type { Device } from '@/types/device';

// ── (unchanged) category pills ───────────────────────────────────
const CATEGORIES = [
    { label: 'Smartphones', icon: '📱', href: '/devices?category=smartphones' },
    { label: 'Laptops', icon: '💻', href: '/devices?category=laptops' },
    { label: 'Tablets', icon: '⬛', href: '/devices?category=tablets' },
    { label: 'Smartwatches', icon: '⌚', href: '/devices?category=watches' },
    { label: 'Earbuds', icon: '🎧', href: '/devices?category=earbuds' },
]

// ── (unchanged) trust points array ──────────────────────────────
const TRUST_POINTS = [
    {
        icon: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
        title: 'Escrow Protection',
        desc: 'Your payment is held safely until you inspect and approve the device.',
    },
    {
        icon: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>),
        title: 'IMEI Verified',
        desc: 'Every device is checked against global stolen databases.',
    },
    {
        icon: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
        title: 'Condition Graded',
        desc: 'Each device graded A+, A, B, or C after physical inspection.',
    },
    {
        icon: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>),
        title: '30-Day Returns',
        desc: 'Not happy? Return within 30 days, no questions asked.',
    },
]

export default function HomePage() {
    // ── NEW: Supabase state (replaces the static FEATURED_DEVICES) ──
    const [featuredDevices, setFeaturedDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getFeaturedDevices(8)
            .then(setFeaturedDevices)
            .finally(() => setLoading(false))
    }, [])
    // ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ==================== HERO ==================== */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-28 pb-24 px-6">
                <div className="max-w-[1160px] mx-auto flex items-center gap-16">
                    <div className="flex-1 max-w-xl">
                        <span className="inline-block text-xs font-bold text-teal-300 tracking-widest uppercase mb-4">
                            Vietnam's Trusted Marketplace
                        </span>
                        <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
                            Buy & Sell<br />
                            <span className="text-teal-300">Second-Hand</span><br />
                            Tech Safely.
                        </h1>
                        <p className="text-teal-100 text-base leading-relaxed mb-8">
                            Real phones, real sellers, real peace of mind.
                        </p>
                        <div className="flex gap-3">
                            <Link href="/devices" className="bg-teal-800 hover:bg-teal-700 text-white font-bold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                                Browse Devices
                            </Link>
                            <Link href="/sell" className="bg-white border-2 border-gray-200 hover:border-teal-400 text-gray-700 hover:text-teal-700 font-semibold px-7 py-3.5 rounded-xl transition-all text-sm">
                                + Sell a Device
                            </Link>
                        </div>
                        <div className="flex gap-8 mt-9">
                            {[{ value: '2,400+', label: 'Devices listed' }, { value: '98%', label: 'Satisfaction rate' }, { value: '< 1hr', label: 'Avg. response' }].map(s => (
                                <div key={s.label}>
                                    <div className="text-2xl font-black text-white">{s.value}</div>
                                    <div className="text-xs text-teal-300 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== CATEGORIES ==================== */}
            <section className="py-6 bg-white border-y border-gray-100 shadow-sm">
                <div className="max-w-[1160px] mx-auto px-6">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0 mr-2">Browse by</span>
                        {CATEGORIES.map(({ label, icon, href }) => (
                            <Link key={label} href={href}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200
                                           hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800
                                           text-sm font-medium text-gray-600 transition-all whitespace-nowrap shrink-0">
                                <span>{icon}</span>{label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== FEATURED DEVICES ==================== */}
            <section className="py-14">
                <div className="max-w-[1160px] mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Featured Devices</h2>
                            <p className="text-sm text-gray-400 mt-1">Hand-picked, verified, and ready to ship</p>
                        </div>
                        <Link href="/devices" className="text-sm font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors">
                            View all
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>
                    </div>

                    {/* ── Loading skeleton ── */}
                    {loading && (
                        <div className="grid grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse">
                                    <div className="bg-gray-100 h-44 rounded-t-2xl" />
                                    <div className="p-4 space-y-2">
                                        <div className="bg-gray-100 h-3 rounded w-1/3" />
                                        <div className="bg-gray-100 h-4 rounded w-3/4" />
                                        <div className="bg-gray-100 h-3 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Grid — DeviceCard is UNCHANGED ── */}
                    {!loading && featuredDevices.length > 0 && (
                        <div className="grid grid-cols-4 gap-4">
                            {featuredDevices.map(d => <DeviceCard key={d.id} device={d} />)}
                        </div>
                    )}

                    {/* ── Empty state ── */}
                    {!loading && featuredDevices.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p className="text-lg">No featured devices yet.</p>
                            <p className="text-sm mt-1">Add listings in Supabase and mark <code>is_featured = true</code>.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ==================== TRUST SECTION ==================== */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-[1160px] mx-auto px-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Go2Hand?</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {TRUST_POINTS.map(({ icon, title, desc }) => (
                            <div key={title} className="flex flex-col items-start gap-3 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">{icon}</div>
                                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}