'use client';

// ============================================
// useFilterOptions — fetches brands and other
// dynamic filter values from Supabase on mount.
// Used by FilterSidebar so it can show real brands.
// ============================================

import { useState, useEffect } from 'react';
import { getBrands } from '@/services/categoryService';

export interface BrandOption {
    id: string;
    name: string;
    slug: string;
}

export interface FilterOptions {
    brands: BrandOption[];
    loading: boolean;
}

export function useFilterOptions(): FilterOptions {
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBrands()
            // getBrands() returns { id, name, slug, ... }[] — pick only what we need
            .then((data) =>
                setBrands(
                    data.map((b: { id: string; name: string; slug: string }) => ({
                        id: b.id,
                        name: b.name,
                        slug: b.slug,
                    }))
                )
            )
            .catch(() => setBrands([]))
            .finally(() => setLoading(false));
    }, []);

    return { brands, loading };
}