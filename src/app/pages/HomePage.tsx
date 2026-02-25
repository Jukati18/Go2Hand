'use client';

// ============================================
// HOME PAGE — Go2Hand
// Route: /  (src/app/page.tsx renders this)
//
// What this file does:
//   1. Shows hero banner
//   2. Shows category shortcuts
//   3. Shows featured devices → each card is a
//      <Link> that goes to /devices/[id]
//   4. Shows trust section
//   5. Renders shared <Footer />
// ============================================

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DeviceCard from '@/components/devices/DeviceCard';
import { FEATURED_DEVICES } from '@/types/devices';

// ── Category pills shown below the hero ──
const CATEGORIES = [
    { label: 'Smartphones', icon: '📱', href: '/devices?category=smartphones' },
    { label: 'Laptops', icon: '💻', href: '/devices?category=laptops' },
    { label: 'Tablets', icon: '⬛', href: '/devices?category=tablets' },
    { label: 'Smartwatches', icon: '⌚', href: '/devices?category=watches' },
    { label: 'Earbuds', icon: '🎧', href: '/devices?category=earbuds' },
];

// ── Trust pillars shown in middle section ──
const TRUST_POINTS = [
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        title: 'Escrow Protection',
        desc: 'Your payment is held safely until you inspect and approve the device. Release it when you are satisfied.',
  },
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
            </svg>
        ),
        title: 'IMEI Verified',
        desc: 'Every device is checked against global stolen databases. iCloud and carrier status confirmed before listing.',
    },
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Condition Graded',
        desc: 'Each device is physically inspected by our team and graded A+, A, B, or C. No surprises on delivery.',
    },
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
            </svg>
        ),
        title: '30-Day Returns',
        desc: 'Not happy? Return within 30 days, no questions asked. We make used-device buying completely risk-free.',
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">

            {/* ── Shared Navbar ── */}
            <Navbar />

            {/* ==================== HERO ==================== */}
            <section className="bg-[#F4F2EE] pt-14 pb-10">
                <div className="max-w-[1160px] mx-auto px-6">

                    <div className="grid grid-cols-[1fr_auto] gap-10 items-center">
                        {/* Left: text */}
                        <div>
                            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100
                              text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Vietnam&apos;s #1 Verified Device Marketplace
                            </div>

                            <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
                                Buy &amp; Sell<br />
                                <span className="text-teal-700">Pre-Owned Devices</span><br />
                                You Can Trust
                            </h1>

                            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
                                Every device IMEI-verified, condition-graded, and covered by
                                escrow payment protection. Real phones, real sellers, real peace of mind.
                            </p>

                            <div className="flex gap-3">
                                {/* Browse devices → goes to listing page */}
                                <Link
                                    href="/devices"
                                    className="bg-teal-800 hover:bg-teal-700 text-white font-bold
                             px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5
                             hover:shadow-lg text-sm"
                                >
                                    Browse Devices
                                </Link>
                                {/* Sell → goes to sell form */}
                                <Link
                                    href="/sell"
                                    className="bg-white border-2 border-gray-200 hover:border-teal-400
                             text-gray-700 hover:text-teal-700 font-semibold
                             px-7 py-3.5 rounded-xl transition-all text-sm"
                                >
                                    + Sell a Device
                                </Link>
                            </div>

                            {/* Quick stats */}
                            <div className="flex gap-8 mt-9">
                                {[
                                    { value: '2,400+', label: 'Devices listed' },
                                    { value: '98%', label: 'Satisfaction rate' },
                                    { value: '< 1hr', label: 'Avg. seller response' },
                                ].map(({ value, label }) => (
                                    <div key={label}>
                                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: hero image placeholder */}
                        <div className="w-[340px] h-[400px] rounded-3xl bg-gradient-to-br from-teal-800 to-teal-600
                            flex items-center justify-center shrink-0 relative overflow-hidden">
                            {/* Decorative rings */}
                            <div className="absolute w-64 h-64 border border-white/10 rounded-full" />
                            <div className="absolute w-96 h-96 border border-white/5  rounded-full" />
                            {/* Phone silhouette */}
                            <div className="relative z-10 text-white/20 text-9xl select-none">📱</div>
                            <div className="absolute bottom-8 left-0 right-0 text-center">
                                <p className="text-white/60 text-sm font-medium">Replace with hero device image</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== CATEGORIES ==================== */}
            <section className="py-6 bg-white border-y border-gray-100 shadow-sm">
                <div className="max-w-[1160px] mx-auto px-6">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0 mr-2">
                            Browse by
                        </span>
                        {CATEGORIES.map(({ label, icon, href }) => (
                            <Link
                                key={label}
                                href={href}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200
                           hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800
                           text-sm font-medium text-gray-600 transition-all whitespace-nowrap shrink-0"
                            >
                                <span>{icon}</span>
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== FEATURED DEVICES ==================== */}
            {/*
        HOW ROUTING WORKS HERE:
        ────────────────────────────────────────────────────────────
        Each <DeviceCard device={d} /> internally renders:
          <Link href={`/devices/${d.id}`}>...</Link>

        So when you click "iPhone 14 Pro Max" card, Next.js reads
        d.id = "iphone-14-pro-max-256-purple" and navigates to:
          /devices/iphone-14-pro-max-256-purple

        That URL matches:  src/app/devices/[id]/page.tsx
        where [id] = "iphone-14-pro-max-256-purple"
        ────────────────────────────────────────────────────────────
      */}
            <section className="py-14">
                <div className="max-w-[1160px] mx-auto px-6">

                    {/* Section header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Featured Devices</h2>
                            <p className="text-sm text-gray-400 mt-1">Hand-picked, verified, and ready to ship</p>
                        </div>
                        <Link
                            href="/devices"
                            className="text-sm font-semibold text-teal-700 hover:text-teal-900
                         flex items-center gap-1 transition-colors"
                        >
                            View all
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                    </div>

                    {/*
            DeviceCard already wraps everything in <Link href={/devices/${device.id}}>
            So clicking any card = going to the detail page automatically.
          */}
                    <div className="grid grid-cols-4 gap-5">
                        {FEATURED_DEVICES.map((device) => (
                            <DeviceCard key={device.id} device={device} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== TRUST SECTION ==================== */}
            <section className="py-14 bg-white border-y border-gray-100">
                <div className="max-w-[1160px] mx-auto px-6">

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Why buyers trust Go2Hand
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Every step of your purchase is designed to protect you
                        </p>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        {TRUST_POINTS.map(({ icon, title, desc }) => (
                            <div key={title}
                                className="bg-gray-50 rounded-2xl p-6 border border-gray-100
                           hover:border-teal-200 hover:bg-teal-50/30 transition-all">
                                <div className="w-11 h-11 bg-teal-100 text-teal-700 rounded-xl
                                flex items-center justify-center mb-4">
                                    {icon}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 text-sm">{title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== CTA BANNER ==================== */}
            <section className="py-14">
                <div className="max-w-[1160px] mx-auto px-6">
                    <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-3xl
                          p-12 flex items-center justify-between">
                        <div className="text-white">
                            <h2 className="text-3xl font-bold mb-2">Have a device to sell?</h2>
                            <p className="text-teal-200 text-sm">
                                List in 5 minutes. Reach thousands of buyers. Get paid safely via escrow.
                            </p>
                        </div>
                        <Link
                            href="/sell"
                            className="bg-white text-teal-800 font-bold px-8 py-4 rounded-xl
                         hover:bg-amber-400 hover:text-white transition-all shrink-0
                         text-sm shadow-lg"
                        >
                            Start Selling →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Shared Footer ── */}
            <Footer />

        </div>
    );
}