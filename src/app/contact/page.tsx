// src/app/contact/page.tsx
// ─────────────────────────────────────────────────────────────────
// Contact Center — /contact
// Server Component shell holding SEO metadata, Quick FAQ links, and support cards.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ContactForm from '@/components/contact/ContactForm'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { LifebuoyIcon as SupportSolid } from '@heroicons/react/24/solid'

export const metadata: Metadata = {
  title: buildTitle(['Contact Support', 'Get Help With Your Deal']),
  description: truncateDesc(
    'Contact the Go2Hand team for escrow transaction inquiries, dispute resolution help, ' +
    'IMEI check support, or general marketplace questions. Fast 24/7 assistance.'
  ),
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/contact`,
    siteName: 'Go2Hand',
    title: 'Contact Go2Hand Support — We Are One Message Away',
    description: 'Real human support engineered for Vietnam\'s safest tech marketplace.',
  },
}

const CONTACT_CHANNELS = [
  {
    icon: EnvelopeIcon,
    title: 'Escrow & General Support',
    value: 'support@go2hand.vn',
    desc: 'For questions regarding payments, refunds, or account verification.',
    badge: '< 2 hrs response'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Dispute Resolution Court',
    value: 'disputes@go2hand.vn',
    desc: 'Submit inspection evidence, unboxing videos, or report fraud attempts.',
    badge: '24h SLA ruling'
  },
  {
    icon: MapPinIcon,
    title: 'Vietnam Headquarters',
    value: 'District 1, Ho Chi Minh City',
    desc: 'Available for official legal notices and brand partnership inquiries.',
    badge: 'Mon - Fri (8:30 - 18:00)'
  }
]

const QUICK_SOLUTIONS = [
  {
    q: 'Where is my money held during the 5-day window?',
    href: '/trust',
    label: 'Read Escrow Architecture'
  },
  {
    q: 'How do I film a valid unboxing video for protection?',
    href: '/buyer-protection',
    label: 'View Video Guidelines'
  },
  {
    q: 'What cosmetic flaws are acceptable for Grade B devices?',
    href: '/docs/Condition-grading-standards',
    label: 'Check Grading Rubric'
  }
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* ── HERO ── */}
        <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-24 px-4 sm:px-6 text-center relative">
          <div className="max-w-[860px] mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <SupportSolid className="w-3.5 h-3.5 text-emerald-400" />
              Go2Hand Help Desk
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Got a question? <span className="text-teal-300">We&apos;re right here.</span>
            </h1>
            <p className="text-teal-100 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              Whether you need urgent escrow intervention or simply want to clarify how our IMEI screening works, real humans are ready to assist.
            </p>
          </div>
        </section>

        {/* ── CHANNELS GRID (Floating over hero bottom) ── */}
        <section className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CONTACT_CHANNELS.map(({ icon: Icon, title, value, desc, badge }) => (
              <div 
                key={title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
                  <p className="text-base font-black text-gray-900 mb-2 select-all">{value}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN CONTENT (SPLIT COLUMNS) ── */}
        <section className="max-w-[1160px] mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Self Service & Quick Links */}
            <div className="space-y-8">
              <div>
                <span className="text-teal-700 text-xs font-bold uppercase tracking-widest block mb-2">Self-Service</span>
                <h2 className="text-2xl font-black text-gray-900 mb-3">Looking for quick answers?</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  90% of user inquiries can be resolved instantly by checking our standard marketplace documentation. Take a look at these popular guides before submitting a ticket:
                </p>
              </div>

              <div className="space-y-3">
                {QUICK_SOLUTIONS.map(({ q, href, label }) => (
                  <Link
                    key={q}
                    href={href}
                    className="group block p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-teal-400 
                      hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 mb-1 group-hover:text-teal-800 transition-colors">{q}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600">
                          {label} <ArrowUpRightIcon className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-teal-900/5 border border-teal-900/10 flex items-start gap-3.5">
                <ClockIcon className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-gray-600">
                  <span className="font-bold text-gray-900 block mb-0.5">Dispute Emergency Notice</span>
                  If you are currently inside your <span className="font-semibold text-teal-900">5-day inspection window</span> and received a defective item, do not wait for email replies. Go straight to your <Link href="/dashboard/orders" className="underline font-bold text-teal-700">Orders Dashboard</Link> and click <span className="text-red-600 font-bold">&quot;Raise Dispute&quot;</span> to freeze escrow funds immediately.
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Client Form */}
            <div>
              <ContactForm />
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}