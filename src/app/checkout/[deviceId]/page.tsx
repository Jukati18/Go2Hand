// src/app/checkout/[deviceId]/page.tsx
// Server Component — fetches device data and guards auth.
// Passes everything to CheckoutClient which handles Stripe.

import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import { getDeviceById } from '@/services/deviceService'
import CheckoutClient from '@/components/checkout/CheckoutClient'

interface Props {
    params: Promise<{ deviceId: string }>
}

export default async function CheckoutPage({ params }: Props) {
    const { deviceId } = await params

    // ── Auth guard ────────────────────────────────────────────────
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

    // ── Fetch device ──────────────────────────────────────────────
    const device = await getDeviceById(deviceId)
    if (!device) notFound()

    // Prevent seller from buying their own listing
    if (device.seller.id === user.id) redirect(`/devices/${deviceId}`)

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <CheckoutClient device={device} />
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