// src/app/layout.tsx
// ============================================
// ROOT LAYOUT
//
// Week 6 update: CartProvider added so the
// cart badge in Navbar reflects live state.
// CartProvider must wrap the entire tree
// because Navbar (client) reads from it.
// ============================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {/*
                    CartProvider wraps the entire app so any component —
                    Navbar, DeviceDetailClient, future CartPage, etc. —
                    can read and mutate cart state via useCart().
                */}
                <CartProvider>
                    {children}
                </CartProvider>
            </body>
        </html>
    );
}