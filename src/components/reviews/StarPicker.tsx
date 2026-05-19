'use client'

// src/components/reviews/StarPicker.tsx
// ============================================
// STAR PICKER — Interactive rating input
//
// Features:
//  • Hover preview (stars light up on hover)
//  • Click to select/deselect
//  • Size variants: sm | md | lg
//  • Optional label per star value
//  • Smooth CSS transitions
//  • Accessible (aria-label on each star)
// ============================================

import { useState } from 'react'

// Labels shown below the stars explaining what each star means
const DEFAULT_LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Excellent',
}

const SIZE = {
    sm: { star: 'text-lg',   gap: 'gap-0.5' },
    md: { star: 'text-2xl',  gap: 'gap-1'   },
    lg: { star: 'text-4xl',  gap: 'gap-1.5' },
}

interface StarPickerProps {
    value: number               // currently selected star (0 = none)
    onChange: (v: number) => void
    size?: 'sm' | 'md' | 'lg'
    showLabels?: boolean
    labels?: Record<number, string>
    className?: string
    disabled?: boolean
}

export default function StarPicker({
    value,
    onChange,
    size = 'md',
    showLabels = false,
    labels = DEFAULT_LABELS,
    className = '',
    disabled = false,
}: StarPickerProps) {
    const [hovered, setHovered] = useState(0)

    // Active = selected or hovered
    const active = hovered > 0 ? hovered : value
    const s = SIZE[size]

    return (
        <div className={`flex flex-col items-start gap-1 ${className}`}>
            <div
                className={`flex ${s.gap}`}
                onMouseLeave={() => setHovered(0)}
                role="group"
                aria-label="Star rating"
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        aria-label={`${star} star${star !== 1 ? 's' : ''} — ${labels[star] ?? ''}`}
                        onMouseEnter={() => !disabled && setHovered(star)}
                        onClick={() => {
                            if (!disabled) {
                                // Clicking the currently selected star deselects it
                                onChange(value === star ? 0 : star)
                            }
                        }}
                        className={`
                            leading-none transition-all duration-150 select-none
                            ${s.star}
                            ${disabled ? 'cursor-default' : 'cursor-pointer'}
                            ${star <= active
                                ? 'text-amber-400 scale-110 drop-shadow-sm'
                                : 'text-gray-200 hover:text-amber-200'
                            }
                        `}
                        style={{
                            // Stagger the scale animation so stars "pop" in sequence
                            transitionDelay: star <= active ? `${(star - 1) * 30}ms` : '0ms',
                        }}
                    >
                        ★
                    </button>
                ))}
            </div>

            {/* Label below stars */}
            {showLabels && active > 0 && (
                <span className="text-xs font-semibold text-amber-600 min-h-[16px] transition-all duration-150">
                    {labels[active]}
                </span>
            )}
        </div>
    )
}