'use client'
// src/components/orders/ConfirmationSuccessBurst.tsx
// ─────────────────────────────────────────────────────────────────
// One-shot success animation shown at the top of the confirmation page.
// Pure CSS — no canvas, no library. Uses keyframe animations injected
// via a <style> tag. Unmounts itself after 4 seconds.
//
// Renders 20 confetti particles with randomised:
//   • color (teal / amber / emerald palette)
//   • size, position, and rotation
//   • fall duration and horizontal drift
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

// Confetti color palette matching Go2Hand brand
const COLORS = [
    '#0f766e', // teal-700
    '#14b8a6', // teal-500
    '#f59e0b', // amber-500
    '#34d399', // emerald-400
    '#fcd34d', // amber-300
    '#5eead4', // teal-300
    '#a7f3d0', // emerald-200
]

interface Particle {
    id: number
    color: string
    left: number   // % across the container
    size: number   // px
    duration: number // ms
    delay: number    // ms
    drift: number    // px horizontal drift
    shape: 'rect' | 'circle'
}

function makeParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        left: 10 + Math.random() * 80,
        size: 6 + Math.random() * 8,
        duration: 1800 + Math.random() * 1400,
        delay: Math.random() * 600,
        drift: (Math.random() - 0.5) * 120,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))
}

interface ConfirmationSuccessBurstProps {
    /** Run the animation. Pass false once order is in a non-fresh state. */
    active?: boolean
}

export default function ConfirmationSuccessBurst({ active = true }: ConfirmationSuccessBurstProps) {
    const [particles] = useState(() => makeParticles(24))
    const [visible, setVisible] = useState(active)
    const [iconPop, setIconPop] = useState(false)

    useEffect(() => {
        if (!active) return

        // Trigger icon pop after a tiny delay
        const iconTimer = setTimeout(() => setIconPop(true), 100)

        // Hide the whole burst after animation completes
        const hideTimer = setTimeout(() => setVisible(false), 4000)

        return () => {
            clearTimeout(iconTimer)
            clearTimeout(hideTimer)
        }
    }, [active])

    if (!visible) return null

    return (
        <>
            {/* Keyframe injection */}
            <style>{`
                @keyframes confetti-fall {
                    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    80%  { opacity: 1; }
                    100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
                }
                @keyframes icon-pop {
                    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
                    60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
                    80%  { transform: scale(0.95) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes ring-expand {
                    0%   { transform: scale(0.8); opacity: 0.6; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes fade-up-in {
                    0%   { transform: translateY(16px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* Container — relative so particles are positioned inside */}
            <div className="relative w-full flex flex-col items-center py-10 overflow-hidden select-none">

                {/* Confetti particles */}
                {particles.map(p => (
                    <div
                        key={p.id}
                        style={{
                            position:        'absolute',
                            top:             0,
                            left:            `${p.left}%`,
                            width:           p.shape === 'rect' ? `${p.size}px` : `${p.size}px`,
                            height:          p.shape === 'rect' ? `${p.size * 0.5}px` : `${p.size}px`,
                            borderRadius:    p.shape === 'circle' ? '50%' : '2px',
                            backgroundColor: p.color,
                            animation:       `confetti-fall ${p.duration}ms ease-in ${p.delay}ms forwards`,
                            transform:       `translateX(${p.drift}px)`,
                        }}
                    />
                ))}

                {/* Success icon with expanding ring */}
                <div className="relative flex items-center justify-center mb-5">
                    {/* Pulsing ring */}
                    <div
                        className="absolute w-20 h-20 rounded-full bg-teal-300"
                        style={{
                            animation: iconPop ? 'ring-expand 0.8s ease-out 0.3s both' : 'none',
                        }}
                    />
                    {/* Solid icon */}
                    <div
                        className="relative w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center shadow-xl"
                        style={{
                            animation: iconPop ? 'icon-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' : 'none',
                        }}
                    >
                        <CheckCircleIcon className="w-11 h-11 text-white" />
                    </div>
                </div>

                {/* Text */}
                <div
                    className="text-center"
                    style={{ animation: iconPop ? 'fade-up-in 0.5s ease 0.4s both' : 'none' }}
                >
                    <h2 className="text-2xl font-black text-gray-900 mb-1">
                        Order Confirmed!
                    </h2>
                    <p className="text-sm text-gray-500">
                        Your payment is safely held in escrow.
                    </p>
                </div>
            </div>
        </>
    )
}