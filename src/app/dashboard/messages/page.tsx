'use client'

// src/app/dashboard/messages/page.tsx
// ─────────────────────────────────────────────────────────────────
// MESSAGES INBOX — /dashboard/messages
//
// Messages is not yet in the DB schema (Week 7 scope).
// This page shows a polished "Coming Soon" state with:
//   • Real search input (UX practice)
//   • A blurred/greyed demo conversation list
//   • Feature explanation
//   • CTAs to browse and go back to dashboard
//
// When messages are implemented, replace the empty state with
// real conversation rows fetched from a `messages` table.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import {
    ChatBubbleLeftEllipsisIcon,
    MagnifyingGlassIcon,
    BellIcon,
    ShieldCheckIcon,
    SparklesIcon,
    ChevronLeftIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ── Demo conversations for the "preview" UI ───────────────────────
// These are purely visual — blurred to show what the feature will look like
const DEMO_CONVERSATIONS = [
    {
        id: '1',
        sellerName: 'Minh Nguyen',
        initials: 'MN',
        avatarGradient: 'from-teal-500 to-emerald-500',
        deviceTitle: 'Apple iPhone 15 Pro 256GB',
        lastMessage: 'Is the device still available? I can pay today.',
        time: '2h ago',
        unread: true,
        price: 899,
    },
    {
        id: '2',
        sellerName: 'Linh Tran',
        initials: 'LT',
        avatarGradient: 'from-violet-500 to-purple-500',
        deviceTitle: 'MacBook Air M2 512GB Space Gray',
        lastMessage: 'Yes, I can ship it tomorrow with tracking!',
        time: '1d ago',
        unread: false,
        price: 1099,
    },
    {
        id: '3',
        sellerName: 'Duc Pham',
        initials: 'DP',
        avatarGradient: 'from-orange-500 to-red-500',
        deviceTitle: 'Samsung Galaxy S24 Ultra 256GB',
        lastMessage: 'The battery health is 94%, barely used.',
        time: '3d ago',
        unread: false,
        price: 749,
    },
    {
        id: '4',
        sellerName: 'Thi Le',
        initials: 'TL',
        avatarGradient: 'from-pink-500 to-rose-500',
        deviceTitle: 'iPad Pro 12.9" M2 128GB WiFi',
        lastMessage: 'Happy to meet in person if you prefer.',
        time: '5d ago',
        unread: false,
        price: 899,
    },
]

// ── Feature highlights shown below the empty state ────────────────
const FEATURES = [
    {
        icon: ChatBubbleLeftEllipsisIcon,
        title: 'Direct seller chat',
        desc: 'Ask questions about condition, specs, or negotiate price directly.',
    },
    {
        icon: ShieldCheckIcon,
        title: 'Stays on Go2Hand',
        desc: 'All conversations are logged and protected — no need to share personal contacts.',
    },
    {
        icon: BellIcon,
        title: 'Real-time notifications',
        desc: 'Get notified the moment a seller replies, even on mobile.',
    },
]

// ═════════════════════════════════════════════════════════════════
export default function MessagesPage() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* ── Breadcrumb / back link ── */}
                <Link
                    href="/dashboard/buyer"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400
                        hover:text-teal-700 transition-colors mb-5 font-medium"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Buyer Dashboard
                </Link>

                {/* ── Page header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Messages
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Chat with sellers about their listings
                        </p>
                    </div>

                    {/* Coming soon badge */}
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200
                        text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Coming Soon
                    </div>
                </div>

                {/* ── Main card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Search bar (non-functional — for UX preview) */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-2.5
                            border border-gray-200 focus-within:border-teal-400
                            focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search conversations…"
                                className="w-full text-sm text-gray-800 bg-transparent outline-none
                                    placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* ── Empty state with blurred demo ── */}
                    <div className="relative">

                        {/* Blurred demo conversations (greyed out preview) */}
                        <div className="select-none pointer-events-none" aria-hidden="true">
                            {DEMO_CONVERSATIONS.map((conv, i) => (
                                <div
                                    key={conv.id}
                                    className={`flex items-center gap-3 px-4 sm:px-5 py-4
                                        border-b border-gray-50 transition-colors
                                        ${conv.unread ? 'bg-white' : 'bg-gray-50/40'}`}
                                    // Progressive blur — first item is clearest
                                    style={{ filter: `blur(${i * 1.5}px)`, opacity: 1 - i * 0.18 }}
                                >
                                    {/* Avatar */}
                                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br
                                        ${conv.avatarGradient} flex items-center justify-center
                                        text-white text-sm font-bold shrink-0`}>
                                        {conv.initials}
                                    </div>

                                    {/* Conversation info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className={`text-sm text-gray-900
                                                ${conv.unread ? 'font-bold' : 'font-semibold'}`}>
                                                {conv.sellerName}
                                            </p>
                                            <p className="text-[10px] text-gray-400 shrink-0 ml-2">
                                                {conv.time}
                                            </p>
                                        </div>
                                        <p className="text-xs text-teal-600 font-medium truncate mb-0.5">
                                            {conv.deviceTitle} · ${conv.price}
                                        </p>
                                        <p className={`text-xs truncate
                                            ${conv.unread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {conv.unread && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Overlay with the actual empty-state CTA */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center
                            px-6 py-10 text-center
                            bg-gradient-to-t from-white via-white/95 to-white/60
                            backdrop-blur-[1px]">

                            {/* Icon with pulse ring */}
                            <div className="relative w-20 h-20 mx-auto mb-5">
                                <div className="absolute inset-0 rounded-full bg-blue-100
                                    animate-ping opacity-30" />
                                <div className="relative w-20 h-20 rounded-full bg-blue-50
                                    border-2 border-blue-100 flex items-center justify-center">
                                    <ChatBubbleLeftEllipsisIcon className="w-9 h-9 text-blue-400" />
                                </div>
                            </div>

                            <h2 className="text-lg font-bold text-gray-900 mb-2">
                                Messaging is on its way
                            </h2>
                            <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
                                Soon you&apos;ll be able to chat directly with sellers — ask questions,
                                negotiate prices, and arrange shipping details without leaving Go2Hand.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/devices"
                                    className="inline-flex items-center justify-center gap-2
                                        bg-teal-800 hover:bg-teal-700 text-white font-semibold
                                        px-6 py-3 rounded-xl text-sm transition-all
                                        hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    Browse Devices
                                </Link>
                                <Link
                                    href="/dashboard/buyer"
                                    className="inline-flex items-center justify-center gap-2
                                        border-2 border-gray-200 hover:border-teal-400
                                        text-gray-600 hover:text-teal-700 font-semibold
                                        px-6 py-3 rounded-xl text-sm transition-colors"
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Feature highlights below the card ── */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                        <div
                            key={title}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                                animate-[fadeUp_.4s_ease_both]"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center
                                justify-center mb-3">
                                <Icon className="w-5 h-5 text-teal-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── Notify me banner ── */}
                <div className="mt-4 bg-gradient-to-r from-teal-800 to-teal-700 rounded-2xl
                    p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4
                    animate-[fadeUp_.4s_ease_both_.3s]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center
                            justify-center shrink-0">
                            <BellIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white mb-0.5">
                                Want to be notified when messages launches?
                            </p>
                            <p className="text-xs text-teal-200 leading-relaxed">
                                Meanwhile, you can contact sellers via the &quot;Make an Offer&quot; button on any device listing.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/devices"
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30
                            border border-white/30 text-white font-semibold text-sm
                            px-5 py-2.5 rounded-xl transition-all shrink-0 hover:scale-105"
                    >
                        Browse Listings
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    )
}