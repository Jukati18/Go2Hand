'use client'

import { useState, useEffect } from 'react'

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
    progressPercent: number
}

function computeState(inspectionStartedAt: string, now: number): CountdownState {
    const started = new Date(inspectionStartedAt).getTime()
    const deadline = started + TOTAL_SECONDS * 1000
    const remaining = Math.max(0, deadline - now)
    const secondsLeft = Math.floor(remaining / 1000)

    const days    = Math.floor(secondsLeft / 86400)
    const hours   = Math.floor((secondsLeft % 86400) / 3600)
    const minutes = Math.floor((secondsLeft % 3600) / 60)
    const seconds = secondsLeft % 60

    const isExpired = secondsLeft <= 0
    const progressPercent = Math.round(((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100)

    let urgencyLevel: UrgencyLevel = 'safe'
    if (isExpired) {
        urgencyLevel = 'expired'
    } else if (secondsLeft < 3600) {
        urgencyLevel = 'urgent'
    } else if (secondsLeft < 86400) {
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
    // 1. Initialize with null to guarantee pure renders and SSR safety
    const [now, setNow] = useState<number | null>(null)

    useEffect(() => {
        if (!inspectionStartedAt) return
         
        // 2. Use setTimeout(..., 0) to fetch the initial time. 
        // This pushes the state update to the next execution tick, bypassing the synchronous update warning.
        const immediateTimeout = setTimeout(() => {
            setNow(Date.now())
        }, 0)

        // 3. Keep ticking every second
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        
        return () => {
            clearTimeout(immediateTimeout)
            clearInterval(interval)
        }
    }, [inspectionStartedAt])

    // 4. Component stays clean and pure
    if (!inspectionStartedAt || now === null) return null
    
    return computeState(inspectionStartedAt, now)
}