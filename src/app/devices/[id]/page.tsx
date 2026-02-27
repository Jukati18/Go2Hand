// src/app/devices/[id]/page.tsx
// Server Component — fetches device from Supabase, renders DetailPage

import { notFound } from 'next/navigation'
import { getDeviceById, getSimilarDevices } from '@/lib/deviceService'
import DetailPage from '@/app/pages/DetailPage'
import { supabase } from '@/lib/supabaseClient'

interface Props {
    params: { id: string }
}

export default async function DeviceDetailRoute({ params }: Props) {
    // 1. Fetch main device from Supabase
    const device = await getDeviceById(params.id)
    if (!device) notFound()

    // 2. Resolve category_id to fetch similar devices
    const { data: product } = await supabase
        .from('products')
        .select('category_id')
        .eq('id', params.id)
        .single()

    const similarDevices = product?.category_id
        ? await getSimilarDevices(product.category_id, params.id, 4)
        : []

    // 3. DetailPage is the UNCHANGED UI component — just pass props
    return <DetailPage device={device} similarDevices={similarDevices} />
}

// Optional: generate page titles for SEO
export async function generateMetadata({ params }: Props) {
    const device = await getDeviceById(params.id)
    if (!device) return {}
    return {
        title: `${device.fullName} — Go2Hand`,
        description: `Buy ${device.fullName} in ${device.conditionLabel} condition for $${device.price}`,
    }
}