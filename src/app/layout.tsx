// src/app/layout.tsx
// ============================================
// ROOT LAYOUT
//
// Providers (outer → inner):
//   AuthProvider  → real Supabase session state
//   CartProvider  → cart badge in Navbar
//
// AuthProvider must be outermost so CartProvider
// and all other components can call useAuth().
// ============================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Go2Hand — Buy & Sell Second-Hand Tech Safely",
    description:
        "Vietnam's most trusted marketplace for pre-owned devices. IMEI verified, escrow protected.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </AuthProvider>
                {/* Loads GA4 with Next.js-optimized script strategy (lazy, after hydration) */}
                <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
            </body>
        </html>
    );
}