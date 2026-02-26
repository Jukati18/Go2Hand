// ============================================
// src/lib/getDevice.ts
//
// PURPOSE:
//   Central data-fetching layer for device data.
//   - Used by the ISR page server component
//   - Returns null when a device isn't found (→ 404)
//   - Easy to swap: replace FEATURED_DEVICES with a
//     real Supabase call when your backend is ready.
// ============================================

import { FEATURED_DEVICES } from "@/types/devices";
import { Device } from "@/types/device";

// ─────────────────────────────────────────────
// Fetch a single device by its slug/id
// Returns null if not found → caller renders 404
// ─────────────────────────────────────────────
export async function getDeviceById(id: string): Promise<Device | null> {
    /*
     * 🔄 FUTURE — replace this block with a Supabase query:
     *
     * const { data, error } = await supabase
     *   .from("products")
     *   .select("*")
     *   .eq("slug", id)
     *   .single();
     *
     * return error ? null : data;
     */

    const device = FEATURED_DEVICES.find((d) => d.id === id);
    return device ?? null;
}

// ─────────────────────────────────────────────
// Fetch "similar devices" for the sidebar grid.
// Excludes the current device; limits to 4.
// ─────────────────────────────────────────────
export async function getSimilarDevices(
    currentId: string,
    brand: string
): Promise<Device[]> {
    /*
     * 🔄 FUTURE — replace with Supabase:
     *
     * const { data } = await supabase
     *   .from("products")
     *   .select("*")
     *   .eq("brand", brand)
     *   .neq("slug", currentId)
     *   .limit(4);
     *
     * return data ?? [];
     */

    return FEATURED_DEVICES.filter(
        (d) => d.id !== currentId && d.brand === brand
    ).slice(0, 4);
}

// ─────────────────────────────────────────────
// Return ALL device ids — used by generateStaticParams
// so Next.js pre-builds every known device page at
// build time (Static Site Generation).
// ─────────────────────────────────────────────
export async function getAllDeviceIds(): Promise<string[]> {
    /*
     * 🔄 FUTURE — replace with Supabase:
     *
     * const { data } = await supabase
     *   .from("products")
     *   .select("slug");
     *
     * return (data ?? []).map((row) => row.slug);
     */

    return FEATURED_DEVICES.map((d) => d.id);
}