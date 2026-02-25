// ============================================
// FOOTER — Shared across all pages
// Usage: import Footer from '@/components/Footer'
//        then just put <Footer /> at bottom
// ============================================

import Link from "next/link";

// Each column in the footer
const FOOTER_COLS = [
    {
        title: "Buy",
        links: [
            { label: "Browse Phones", href: "/devices?category=smartphones" },
            { label: "Browse Laptops", href: "/devices?category=laptops" },
            { label: "Browse Tablets", href: "/devices?category=tablets" },
            { label: "How Escrow Works", href: "/how-it-works" },
            { label: "Buyer Protection", href: "/buyer-protection" },
        ],
    },
    {
        title: "Sell",
        links: [
            { label: "List a Device", href: "/sell" },
            { label: "Condition Guide", href: "/condition-guide" },
            { label: "Seller Guidelines", href: "/seller-guidelines" },
            { label: "Get Verified", href: "/get-verified" },
            { label: "Fees & Payouts", href: "/fees" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Trust & Safety", href: "/trust" },
            { label: "FAQ", href: "/faq" },
            { label: "Contact", href: "/contact" },
            { label: "Blog", href: "/blog" },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400">
            {/* ── Main columns ── */}
            <div
                className="max-w-[1160px] mx-auto px-6 pt-12 pb-8
                      grid grid-cols-[2fr_1fr_1fr_1fr] gap-10"
            >
                {/* Brand block */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
                            <svg
                                className="w-5 h-5 text-white"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L18.18 8 12 11.82 5.82 8 12 4.18zM5 9.5l6 3.32V19.5L5 16.18V9.5zm8 9.98v-7.16l6-3.32v6.68L13 19.48z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-lg">
                            Go2 <span className="text-amber-400">Hand</span>
                        </span>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
                        Vietnam&apos;s most trusted marketplace for pre-owned devices. Every
                        device verified, every transaction protected.
                    </p>

                    {/* Trust badges */}
                    <div className="flex gap-3 mt-5">
                        <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-lg">
                            <svg
                                className="w-3.5 h-3.5 text-emerald-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span className="text-xs text-gray-300 font-medium">
                                Escrow Protected
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-lg">
                            <svg
                                className="w-3.5 h-3.5 text-teal-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-300 font-medium">
                                IMEI Verified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Link columns */}
                {FOOTER_COLS.map(({ title, links }) => (
                    <div key={title}>
                        <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">
                            {title}
                        </p>
                        <ul className="flex flex-col gap-2">
                            {links.map(({ label, href }) => (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        className="text-sm text-gray-400 hover:text-white transition-colors duration-150"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* ── Bottom bar ── */}
            <div
                className="max-w-[1160px] mx-auto px-6 py-5
                      border-t border-gray-800
                      flex items-center justify-between text-xs text-gray-500"
            >
                <span>© 2025 Go2Hand. All rights reserved.</span>
                <div className="flex gap-4">
                    <Link href="/privacy" className="hover:text-white transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="hover:text-white transition-colors">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}
