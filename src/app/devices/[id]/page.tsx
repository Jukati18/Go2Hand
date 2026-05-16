// src/app/devices/[id]/page.tsx
// Server Component — fetches device from Supabase, renders DetailPage

import { notFound } from 'next/navigation'
import { getDeviceById, getSimilarDevices } from '@/services/deviceService'
import DeviceDetailClient from '@/components/devices/DeviceDetailClient';
import { supabase } from '@/lib/supabaseClient'
import { isInWatchlist } from '@/actions/watchlist'

interface Props {
    params: Promise<{ id: string }>
}

export default async function DeviceDetailRoute({ params }: Props) {
    const { id } = await params

    // 1. Fetch main device
    const device = await getDeviceById(id)
    if (!device) notFound()

    // 2. Fetch similar devices (same category)
    const { data: product } = await supabase
        .from('products')
        .select('category_id')
        .eq('id', id)
        .single()

    const similarDevices = product?.category_id
        ? await getSimilarDevices(product.category_id, id, 4)
        : []

    // 3. Check if current user has this device in their watchlist.
    //    isInWatchlist() returns false gracefully when not logged in.
    const initialSaved = await isInWatchlist(id)

    return (
        <DeviceDetailClient
            device={device}
            similarDevices={similarDevices}
            initialSaved={initialSaved}
        />
    )
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const device = await getDeviceById(id)
    if (!device) return {}
    return {
        title: `${device.fullName} — Go2Hand`,
        description: `Buy ${device.fullName} in ${device.conditionLabel} condition for $${device.price}`,
    }
}