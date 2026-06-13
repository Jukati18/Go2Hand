'use client'
// src/hooks/useInspectionCountdown.ts
// ─────────────────────────────────────────────────────────────────
// Live countdown timer for the 5-day inspection window.
//
// Returns:
//   days, hours, minutes, seconds  — time breakdown
//   totalSecondsLeft               — for progress bar
//   totalSecondsAllotted           — denominator for progress bar
//   urgencyLevel                   — 'safe' | 'warning' | 'urgent' | 'expired'
//   isExpired                      — true when window has closed
//   formattedDeadline              — human-readable deadline string
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'

const INSPECTION_DAYS = 5
const TOTAL_SECONDS = INSPECTION_DAYS * 24 * 60 * 60

export type UrgencyLevel = 'safe' | 'warning' | 'urgent' | 'expired'

export interface CountdownState {
    days: number
    hours: number
    minutes: number
    seconds: number
    totalSecondsLeft: number
    totalSecondsAllotted: number
    urgencyLevel: UrgencyLevel
    isExpired: boolean
    formattedDeadline: string
    progressPercent: number // 0–100, fills as time runs out
}

function computeState(inspectionStartedAt: string): CountdownState {
    const started = new Date(inspectionStartedAt).getTime()
    const deadline = started + TOTAL_SECONDS * 1000
    const now = Date.now()
    const remaining = Math.max(0, deadline - now)
    const secondsLeft = Math.floor(remaining / 1000)

    const days    = Math.floor(secondsLeft / 86400)
    const hours   = Math.floor((secondsLeft % 86400) / 3600)
    const minutes = Math.floor((secondsLeft % 3600) / 60)
    const seconds = secondsLeft % 60

    const isExpired = secondsLeft <= 0
    const progressPercent = Math.round(((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100)

    // Urgency thresholds
    let urgencyLevel: UrgencyLevel = 'safe'
    if (isExpired) {
        urgencyLevel = 'expired'
    } else if (secondsLeft < 3600) {
        // Less than 1 hour
        urgencyLevel = 'urgent'
    } else if (secondsLeft < 86400) {
        // Less than 1 day
        urgencyLevel = 'warning'
    }

    const formattedDeadline = new Date(deadline).toLocaleDateString('en-US', {
        weekday: 'long',
        month:   'long',
        day:     'numeric',
        hour:    '2-digit',
        minute:  '2-digit',
    })

    return {
        days,
        hours,
        minutes,
        seconds,
        totalSecondsLeft: secondsLeft,
        totalSecondsAllotted: TOTAL_SECONDS,
        urgencyLevel,
        isExpired,
        formattedDeadline,
        progressPercent,
    }
}

export function useInspectionCountdown(
    inspectionStartedAt: string | null | undefined
): CountdownState | null {
    const [state, setState] = useState<CountdownState | null>(() => {
        if (!inspectionStartedAt) return null
        return computeState(inspectionStartedAt)
    })

    const tick = useCallback(() => {
        if (!inspectionStartedAt) return
        setState(computeState(inspectionStartedAt))
    }, [inspectionStartedAt])

    useEffect(() => {
        if (!inspectionStartedAt) return

        // Tick immediately, then every second
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [inspectionStartedAt, tick])

    return state
}