'use client'
// src/components/sell/StepCondition.tsx
// ─────────────────────────────────────────────────────────────────
// Step 3: Condition grading + photo upload + IMEI/serial check
// ─────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import {
    CloudArrowUpIcon,
    XMarkIcon,
    ArrowsUpDownIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import ImeiVerificationInput from '@/components/sell/ImeiVerificationInput'
import type { VerificationResult } from '@/lib/imeiValidator'
import type { SellFormData } from '@/hooks/useSellForm'

// ── Condition grade definitions ────────────────────────────────────
const CONDITIONS = [
    {
        value: 'like_new' as const,
        grade: 'A+',
        label: 'Like New',
        color: 'emerald',
        description: 'Never used or used only a few times. No scratches, original packaging ideally included.',
        examples: ['Screen protector still on', 'Box accessories intact', 'Zero visible wear'],
    },
    {
        value: 'excellent' as const,
        grade: 'A',
        label: 'Excellent',
        color: 'teal',
        description: 'Light signs of use. Small scuffs only visible under harsh lighting. Fully functional.',
        examples: ['Micro-scratches on back', 'Perfect screen', 'All buttons work perfectly'],
    },
    {
        value: 'good' as const,
        grade: 'B',
        label: 'Good',
        color: 'blue',
        description: 'Normal everyday wear. Minor scratches visible but nothing that affects use.',
        examples: ['Light corner wear', 'Minor scratches on back', 'Screen in good condition'],
    },
    {
        value: 'fair' as const,
        grade: 'C',
        label: 'Fair',
        color: 'amber',
        description: 'Noticeable wear and cosmetic damage. Fully functional but shows its age.',
        examples: ['Visible scratches / scuffs', 'Possible small dent', 'Screen crack-free but worn'],
    },
]

// Grade color classes
const GRADE_COLORS: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
    emerald: {
        ring:  'ring-emerald-500 border-emerald-500',
        bg:    'bg-emerald-50',
        text:  'text-emerald-800',
        badge: 'bg-emerald-500 text-white',
    },
    teal: {
        ring:  'ring-teal-500 border-teal-500',
        bg:    'bg-teal-50',
        text:  'text-teal-800',
        badge: 'bg-teal-600 text-white',
    },
    blue: {
        ring:  'ring-blue-500 border-blue-500',
        bg:    'bg-blue-50',
        text:  'text-blue-800',
        badge: 'bg-blue-500 text-white',
    },
    amber: {
        ring:  'ring-amber-500 border-amber-500',
        bg:    'bg-amber-50',
        text:  'text-amber-800',
        badge: 'bg-amber-500 text-white',
    },
}

interface StepConditionProps {
    data: SellFormData
    errors: Partial<Record<string, string>>
    patch: (updates: Partial<SellFormData>) => void
    addPhotos: (files: File[]) => void
    removePhoto: (index: number) => void
    reorderPhotos: (from: number, to: number) => void
}

export default function StepCondition({
    data, errors, patch,
    addPhotos, removePhoto, reorderPhotos,
}: StepConditionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    // Track which photo is being dragged for reorder
    const dragFromRef = useRef<number | null>(null)

    // ── File drop / pick handler ───────────────────────────────────
    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return
        const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
        addPhotos(valid)
    }, [addPhotos])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
    }, [handleFiles])

    // ── IMEI result handler ───────────────────────────────────────
    function handleImeiResult(result: VerificationResult | null) {
        if (!result) {
            patch({ imeiStatus: '' })
            return
        }
        if (result.status === 'clean') patch({ imeiStatus: 'clean' })
        else if (result.status === 'flagged') patch({ imeiStatus: 'flagged' })
        else patch({ imeiStatus: '' }) // invalid format — don't set
    }

    // Determine IMEI vs Serial based on category
    const isPhone  = data.category?.slug === 'smartphones'
    const verifyType: 'imei' | 'serial' = isPhone ? 'imei' : 'serial'

    return (
        <div className="flex flex-col gap-8">

            {/* ── CONDITION GRADING ── */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                    Condition Grade <span className="text-red-400">*</span>
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    Be honest — buyers can open a dispute if the device condition doesn&apos;t match.
                    Accurate listings sell faster and get better reviews.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CONDITIONS.map(cond => {
                        const selected = data.condition === cond.value
                        const colors   = GRADE_COLORS[cond.color]

                        return (
                            <button
                                key={cond.value}
                                type="button"
                                onClick={() => patch({ condition: cond.value })}
                                className={`
                                    text-left p-4 rounded-2xl border-2 transition-all duration-200
                                    ${selected
                                        ? `${colors.bg} ${colors.ring} ring-1`
                                        : 'bg-white border-gray-100 hover:border-gray-300'
                                    }
                                `}
                            >
                                {/* Grade badge + label */}
                                <div className="flex items-center gap-2.5 mb-2">
                                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center
                                        text-base font-black ${colors.badge}`}>
                                        {cond.grade}
                                    </span>
                                    <div>
                                        <p className={`text-sm font-bold leading-tight
                                            ${selected ? colors.text : 'text-gray-800'}`}>
                                            {cond.label}
                                        </p>
                                    </div>
                                    {/* Selected checkmark */}
                                    {selected && (
                                        <svg className={`w-4 h-4 ml-auto ${colors.text}`}
                                            viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd"
                                                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"
                                                clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
                                    {cond.description}
                                </p>

                                {/* Examples list */}
                                <div className="flex flex-col gap-0.5">
                                    {cond.examples.map(ex => (
                                        <span key={ex}
                                            className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {errors.condition && (
                    <p className="text-xs text-red-500 mt-2">{errors.condition}</p>
                )}
            </section>

            {/* ── BATTERY HEALTH ── */}
            {isPhone && (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Battery Health</h3>
                    <p className="text-xs text-gray-400 mb-3">
                        Find this in Settings → Battery → Battery Health (iPhone) or
                        Settings → Battery → Battery Usage (Android).
                    </p>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={50}
                            max={100}
                            value={data.batteryHealth}
                            onChange={e => patch({ batteryHealth: Number(e.target.value) })}
                            className="flex-1 accent-teal-600"
                        />
                        <div className={`w-16 h-10 rounded-xl flex items-center justify-center
                            text-base font-bold shrink-0
                            ${data.batteryHealth >= 90 ? 'bg-emerald-50 text-emerald-700'
                              : data.batteryHealth >= 80 ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-600'}`}>
                            {data.batteryHealth}%
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>50%</span>
                        <span className="text-emerald-600 font-medium">≥90% = Excellent</span>
                        <span>100%</span>
                    </div>
                </section>
            )}

            {/* ── PHOTO UPLOAD ── */}
            <section>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-800">
                        Device Photos <span className="text-red-400">*</span>
                    </h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                        ${data.photos.length >= 5
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                        {data.photos.length}/10 — min 5 required
                    </span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                    Upload clear photos: front, back, sides, screen on, and any scratches.
                    Honest photos build buyer trust and reduce disputes.
                </p>

                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => data.photos.length < 10 && fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-8 text-center
                        transition-all duration-200 cursor-pointer
                        ${dragging
                            ? 'border-teal-500 bg-teal-50'
                            : data.photos.length >= 10
                                ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                        }
                    `}
                >
                    <CloudArrowUpIcon className={`w-10 h-10 mx-auto mb-3
                        ${dragging ? 'text-teal-500' : 'text-gray-300'}`} />
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                        {dragging ? 'Drop photos here' : 'Drag & drop photos or click to upload'}
                    </p>
                    <p className="text-xs text-gray-400">
                        JPG, PNG, WebP · Up to 10 photos · Max 10MB each
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={e => handleFiles(e.target.files)}
                    />
                </div>

                {errors.photos && (
                    <p className="text-xs text-red-500 mt-2">{errors.photos}</p>
                )}

                {/* Photo grid preview */}
                {data.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {data.photos.map((photo, i) => (
                            <div
                                key={photo.previewUrl}
                                draggable
                                onDragStart={() => { dragFromRef.current = i }}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault()
                                    if (dragFromRef.current !== null && dragFromRef.current !== i) {
                                        reorderPhotos(dragFromRef.current, i)
                                        dragFromRef.current = null
                                    }
                                }}
                                className={`relative group aspect-square rounded-xl overflow-hidden
                                    border-2 cursor-grab active:cursor-grabbing
                                    ${i === 0
                                        ? 'border-teal-500' // first photo = cover photo
                                        : 'border-gray-200'
                                    }`}
                            >
                                <Image
                                    src={photo.previewUrl}
                                    alt={`Photo ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />

                                {/* Cover badge */}
                                {i === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-teal-600/90
                                        text-white text-[9px] font-bold text-center py-0.5">
                                        COVER
                                    </div>
                                )}

                                {/* Reorder hint */}
                                <div className="absolute inset-0 bg-black/30 opacity-0
                                    group-hover:opacity-100 transition-opacity flex items-center
                                    justify-center">
                                    <ArrowsUpDownIcon className="w-5 h-5 text-white" />
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); removePhoto(i) }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full
                                        flex items-center justify-center opacity-0 group-hover:opacity-100
                                        transition-opacity hover:bg-red-600 z-10"
                                >
                                    <XMarkIcon className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}

                        {/* Add more button */}
                        {data.photos.length < 10 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-xl border-2 border-dashed border-gray-200
                                    flex flex-col items-center justify-center gap-1
                                    hover:border-teal-400 hover:bg-teal-50 transition-all text-gray-400
                                    hover:text-teal-600"
                            >
                                <CloudArrowUpIcon className="w-5 h-5" />
                                <span className="text-[10px] font-semibold">Add more</span>
                            </button>
                        )}
                    </div>
                )}

                {data.photos.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-2">
                        Drag photos to reorder · First photo is the cover image
                    </p>
                )}
            </section>

            {/* ── IMEI / SERIAL VERIFICATION ── */}
            <section>
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheckIcon className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-gray-800">
                        {verifyType === 'imei' ? 'IMEI Verification' : 'Serial Number Verification'}
                        <span className="text-red-400 ml-0.5">*</span>
                    </h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                    Required for all listings. A clean check builds buyer trust and increases
                    your chance of a fast sale.
                </p>

                <ImeiVerificationInput
                    type={verifyType}
                    label={verifyType === 'imei' ? 'IMEI Number' : 'Serial Number'}
                    required
                    onResult={handleImeiResult}
                />

                {errors.imeiStatus && !data.imeiStatus && (
                    <p className="text-xs text-red-500 mt-2">{errors.imeiStatus}</p>
                )}

                {/* iCloud + Carrier lock status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400
                            uppercase tracking-wider mb-2">
                            iCloud / Google Account Lock
                        </label>
                        <div className="flex gap-2">
                            {(['unlocked', 'locked'] as const).map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => patch({ icloudStatus: val })}
                                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold
                                        transition-all duration-150
                                        ${data.icloudStatus === val
                                            ? val === 'unlocked'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                                : 'bg-red-50 border-red-400 text-red-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    {val === 'unlocked' ? '✓ Unlocked' : '✗ Locked'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400
                            uppercase tracking-wider mb-2">
                            Carrier / Network Lock
                        </label>
                        <div className="flex gap-2">
                            {(['unlocked', 'locked'] as const).map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => patch({ carrierStatus: val })}
                                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold
                                        transition-all duration-150
                                        ${data.carrierStatus === val
                                            ? val === 'unlocked'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                                : 'bg-amber-50 border-amber-400 text-amber-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    {val === 'unlocked' ? '✓ Unlocked' : '⚠ Locked'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── DESCRIPTION ── */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                    Seller Description
                    <span className="text-gray-400 font-normal text-xs ml-2">(optional)</span>
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                    Add any extra details buyers should know — accessories included,
                    reason for selling, purchase date, etc.
                </p>
                <textarea
                    rows={4}
                    value={data.description}
                    onChange={e => patch({ description: e.target.value })}
                    maxLength={800}
                    placeholder="e.g. Bought in March 2024, barely used. Original box and charger included. Always kept in a case with screen protector. Selling because I upgraded."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                        text-gray-800 outline-none resize-none
                        focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition
                        placeholder:text-gray-400"
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">
                    {data.description.length}/800
                </p>
            </section>
        </div>
    )
}