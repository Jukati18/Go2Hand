// src/app/sell/page.tsx
// ─────────────────────────────────────────────────────────────────
// /sell — Sell Device page
// Server Component: auth guard + layout shell.
// The form itself is client-only (SellDeviceForm).
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SellDeviceForm from '@/components/sell/SellDeviceForm'
import Link from 'next/link'
import {
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ClockIcon,
} from '@heroicons/react/24/outline'

export default async function SellPage() {
    // ── Auth guard ────────────────────────────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {},
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/sell')

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            {/* ── Teal hero header ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700
                pt-8 pb-10 px-4 sm:px-6">
                <div className="max-w-[760px] mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-[12px] text-teal-300 mb-5 flex-wrap">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>›</span>
                        <span className="text-white font-medium">Sell a Device</span>
                    </nav>

                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                        List your device
                    </h1>
                    <p className="text-teal-200 text-sm leading-relaxed mb-6 max-w-lg">
                        Reach thousands of verified buyers. Takes less than 5 minutes —
                        we guide you through every step.
                    </p>

                    {/* Trust pills */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { icon: CurrencyDollarIcon, text: 'Free to list' },
                            { icon: ShieldCheckIcon,    text: 'Escrow protects you' },
                            { icon: ClockIcon,          text: 'Sell in as little as 24 hrs' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text}
                                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm
                                    border border-white/20 text-white text-xs font-medium
                                    px-3 py-1.5 rounded-full">
                                <Icon className="w-3.5 h-3.5" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Form area ── */}
            <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-16">
                <SellDeviceForm />
            </div>

            <Footer />
        </div>
    )
}

export const metadata = {
    title: 'Sell a Device — Go2Hand',
    description: 'List your second-hand device on Go2Hand. Free listing, IMEI verified, escrow-protected payments.',
}