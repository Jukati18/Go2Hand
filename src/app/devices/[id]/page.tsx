// ============================================
// src/app/devices/[id]/page.tsx
//
// WHAT THIS FILE DOES:
//   • Dynamic Route  — matches /devices/:id
//   • ISR            — revalidates every 60 seconds
//   • generateStaticParams — pre-builds known device
//     pages at build time (zero cold-start for users)
//   • notFound()     — returns 404 for unknown ids
// ============================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import DetailPage from "@/app/pages/DetailPage";
import {
    getDeviceById,
    getSimilarDevices,
    getAllDeviceIds,
} from "@/lib/getDevice";

// ─────────────────────────────────────────────
// ISR CONFIG
// Tells Next.js: "re-generate this page at most
// once every 60 seconds after a request comes in."
// Change to a higher value (e.g. 3600) for pages
// that update rarely.
// ─────────────────────────────────────────────
export const revalidate = 60;

// ─────────────────────────────────────────────
// generateStaticParams
//
// Runs at BUILD TIME only.
// Returns every known device id → Next.js pre-renders
// each one as a static HTML file.
//
// Example output:
//   [
//     { id: "iphone-14-pro-max-256-purple" },
//     { id: "samsung-galaxy-s23-ultra-256-black" },
//     ...
//   ]
// ─────────────────────────────────────────────
export async function generateStaticParams() {
    const ids = await getAllDeviceIds();

    // Each object must match the dynamic segment name [id]
    return ids.map((id) => ({ id }));
}

// ─────────────────────────────────────────────
// generateMetadata
//
// Runs server-side per request (or at build time
// for static paths). Gives each device page its
// own <title> and Open Graph tags for SEO.
// ─────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    // ⚠️  In Next.js 15, params is a Promise — always await it.
    const { id } = await params;
    const device = await getDeviceById(id);

    if (!device) {
        return { title: "Device Not Found | Go2Hand" };
    }

    return {
        title: `${device.fullName} — ${device.conditionLabel} | Go2Hand`,
        description: `Buy ${device.fullName} in ${device.conditionLabel} condition for $${device.price}. Verified, inspected, and ready to ship.`,
        openGraph: {
            title: `${device.fullName} | Go2Hand`,
            description: `$${device.price} · Grade ${device.grade} · ${device.conditionLabel}`,
            images: device.images[0] ? [{ url: device.images[0] }] : [],
        },
    };
}

// ─────────────────────────────────────────────
// Page Component (Server Component)
//
// Props shape: { params: Promise<{ id: string }> }
// Next.js 15 App Router passes params as a Promise.
// ─────────────────────────────────────────────
export default async function DeviceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // 1️⃣  Await the dynamic segment
    const { id } = await params;

    // 2️⃣  Fetch device data (mock now → Supabase later)
    const device = await getDeviceById(id);

    // 3️⃣  Unknown id → Next.js renders the nearest not-found.tsx
    if (!device) {
        notFound();
    }

    // 4️⃣  Fetch similar devices for the "You May Like" section
    const similarDevices = await getSimilarDevices(id, device.brand);

    // 5️⃣  Hand off to the Client Component for all interactivity.
    //      DetailPage receives plain serialisable props — no issues
    //      crossing the server/client boundary.
    return <DetailPage device={device} similarDevices={similarDevices} />;
}