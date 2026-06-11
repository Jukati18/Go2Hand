// src/app/checkout/[deviceId]/page.tsx
// ─────────────────────────────────────────────────────────────────
// Checkout page — Server Component
//
// Responsibilities:
//   1. Auth guard  → redirect to /login if not signed in
//   2. Device fetch → 404 if not found or already sold
//   3. Self-purchase guard → redirect back to device page
//   4. Renders Navbar + CheckoutClient (which owns the form UI)


import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getDeviceById } from '@/services/deviceService'
import CheckoutClient from '@/components/checkout/CheckoutClient'

interface Props {
    params: Promise<{ deviceId: string }>
}

export default async function CheckoutPage({ params }: Props) {
    const { deviceId } = await params

    // ── 1. Auth guard ─────────────────────────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/login?next=/checkout/${deviceId}`)

    // ── 2. Fetch device ───────────────────────────────────────────
    const device = await getDeviceById(deviceId)
    if (!device) notFound()

    // ── 3. Self-purchase guard ─────────────────────────────────────
    if (device.seller.id === user.id) redirect(`/devices/${deviceId}`)

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <CheckoutClient device={device} />
            <Footer />
        </div>
    )
}

export async function generateMetadata({ params }: Props) {
    const { deviceId } = await params
    const device = await getDeviceById(deviceId)
    return {
        title: device ? `Buy ${device.fullName} — Go2Hand` : 'Checkout — Go2Hand',
    }
}