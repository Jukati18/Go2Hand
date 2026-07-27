'use client'
// src/hooks/useInView.ts
// ─────────────────────────────────────────────────────────────────
// Generic IntersectionObserver hook for lazy-mounting components.
//
// Usage:
//   const { ref, inView } = useInView<HTMLDivElement>()
//   return <div ref={ref}>{inView ? <Heavy /> : <Skeleton />}</div>
//
// rootMargin lets the element "trigger" before it's actually on
// screen — e.g. '300px 0px' starts loading 300px early so there's
// no visible pop-in while scrolling.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
    /** Expands/shrinks the observer's trigger box. Default: load 300px early. */
    rootMargin?: string
    /** Fraction of the element that must be visible to trigger. Default: 0 (any pixel). */
    threshold?: number
    /** Once visible, stop observing (don't unmount when scrolled away). Default: true. */
    triggerOnce?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
    options: UseInViewOptions = {}
) {
    const { rootMargin = '300px 0px', threshold = 0, triggerOnce = true } = options

    const ref = useRef<T | null>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const node = ref.current
        if (!node) return

        // Graceful fallback: if IntersectionObserver isn't available
        // (very old browsers), just render immediately instead of
        // permanently hiding content.
        if (typeof IntersectionObserver === 'undefined') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    if (triggerOnce) observer.disconnect()
                } else if (!triggerOnce) {
                    setInView(false)
                }
            },
            { rootMargin, threshold }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [rootMargin, threshold, triggerOnce])

    return { ref, inView }
}