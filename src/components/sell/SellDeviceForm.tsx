'use client'
// src/components/sell/SellDeviceForm.tsx
// ─────────────────────────────────────────────────────────────────
// Orchestrates all 4 sell steps.
// Owns the progress stepper, back/next/submit buttons, and the
// final image upload → createDevice call.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { useSellForm } from '@/hooks/useSellForm'
import { uploadProductImage } from '@/services/storageService'
import { actionCreateDevice } from '@/actions/device'
import StepCategory  from './StepCategory'
import StepDetails   from './StepDetails'
import StepCondition from './StepCondition'
import StepPricing   from './StepPricing'

// ── Step metadata for the progress bar ────────────────────────────
const STEPS = [
    { n: 1, label: 'Category',  sublabel: 'Type & brand'    },
    { n: 2, label: 'Details',   sublabel: 'Model & specs'   },
    { n: 3, label: 'Condition', sublabel: 'Photos & check'  },
    { n: 4, label: 'Pricing',   sublabel: 'Set your price'  },
] as const

export default function SellDeviceForm() {
    const router = useRouter()
    const {
        step, data, errors, patch,
        goNext, goBack,
        addPhotos, removePhoto, reorderPhotos,
    } = useSellForm()

    const [submitting,   setSubmitting]   = useState(false)
    const [submitError,  setSubmitError]  = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    // ── Final submit: upload images → create listing ───────────────
    async function handleSubmit() {
        setSubmitError(null)
        setSubmitting(true)

        try {
            // 1. We need a temp device ID for the storage path.
            //    We'll use crypto.randomUUID() and pass it to actionCreateDevice
            //    so images and the product row share the same ID prefix.
            const tempId = crypto.randomUUID()

            // 2. Upload all photos in parallel and collect public URLs
            const total = data.photos.length
            let done = 0

            const imageUrls = await Promise.all(
                data.photos.map(async (photo, i) => {
                    const url = await uploadProductImage(photo.file, tempId, i)
                    done++
                    setUploadProgress(Math.round((done / total) * 80)) // 80% = upload phase
                    return url
                })
            )

            setUploadProgress(85)

            // 3. Build FormData for actionCreateDevice
            const fd = new FormData()
            fd.set('title',             data.customTitle.trim() || `${data.brand?.name ?? ''} ${data.model?.model_name ?? ''}`.trim())
            fd.set('brand_id',          data.brand!.id)
            fd.set('category_id',       data.category!.id)
            fd.set('device_model_id',   data.model?.id ?? '')
            fd.set('price',             String(data.price))
            fd.set('original_price',    String(data.originalPrice || data.price))
            fd.set('condition',         data.condition)
            fd.set('color',             data.color)
            fd.set('storage_capacity',  data.storage)
            fd.set('battery_health',    String(data.batteryHealth))
            fd.set('imei_status',       data.imeiStatus || 'clean')
            fd.set('icloud_status',     data.icloudStatus || 'unlocked')
            fd.set('carrier_status',    data.carrierStatus || 'unlocked')
            fd.set('description',       data.description)
            fd.set('images',            imageUrls.join(','))
            fd.set('specs',             JSON.stringify(data.specs))

            setUploadProgress(90)

            // 4. Create the device listing in the DB
            const result = await actionCreateDevice(fd)

            if (!result.success) {
                throw new Error(result.error ?? 'Failed to create listing')
            }

            setUploadProgress(100)

            // 5. Redirect to the new listing or dashboard
            router.push(`/devices/${result.deviceId}`)

        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
            setUploadProgress(0)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-[760px] mx-auto">

            {/* ── PROGRESS STEPPER ── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
                <div className="flex items-center gap-0">
                    {STEPS.map((s, i) => {
                        const isDone    = step > s.n
                        const isCurrent = step === s.n

                        return (
                            <div key={s.n} className="flex items-center flex-1">
                                {/* Step circle + label */}
                                <div className="flex flex-col items-center gap-1 min-w-0">
                                    <div className={`
                                        w-9 h-9 rounded-full flex items-center justify-center
                                        border-2 transition-all duration-300 shrink-0
                                        ${isDone
                                            ? 'bg-teal-600 border-teal-600'
                                            : isCurrent
                                                ? 'bg-white border-teal-600 shadow-lg shadow-teal-100'
                                                : 'bg-white border-gray-200'
                                        }
                                    `}>
                                        {isDone ? (
                                            <CheckSolid className="w-4 h-4 text-white" />
                                        ) : (
                                            <span className={`text-sm font-bold
                                                ${isCurrent ? 'text-teal-700' : 'text-gray-300'}`}>
                                                {s.n}
                                            </span>
                                        )}
                                    </div>
                                    {/* Label — hidden on very small screens */}
                                    <div className="text-center hidden sm:block">
                                        <p className={`text-[11px] font-bold leading-tight
                                            ${isCurrent ? 'text-teal-800' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                                            {s.label}
                                        </p>
                                        <p className="text-[9px] text-gray-400">{s.sublabel}</p>
                                    </div>
                                </div>

                                {/* Connector line (not after last step) */}
                                {i < STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-2 rounded-full transition-colors duration-500
                                        ${step > s.n ? 'bg-teal-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── STEP CONTENT ── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8
                animate-[fadeUp_.3s_ease_both]">

                {/* Section heading */}
                <div className="mb-7 pb-5 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">
                        Step {step} of 4
                    </p>
                    <h2 className="text-xl font-black text-gray-900">
                        {STEPS[step - 1].label}
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {STEPS[step - 1].sublabel}
                    </p>
                </div>

                {step === 1 && (
                    <StepCategory
                        data={data}
                        errors={errors}
                        patch={patch}
                    />
                )}
                {step === 2 && (
                    <StepDetails
                        data={data}
                        errors={errors}
                        patch={patch}
                    />
                )}
                {step === 3 && (
                    <StepCondition
                        data={data}
                        errors={errors}
                        patch={patch}
                        addPhotos={addPhotos}
                        removePhoto={removePhoto}
                        reorderPhotos={reorderPhotos}
                    />
                )}
                {step === 4 && (
                    <StepPricing
                        data={data}
                        errors={errors}
                        patch={patch}
                    />
                )}

                {/* ── Submit error ── */}
                {submitError && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                )}

                {/* ── Upload progress bar ── */}
                {submitting && uploadProgress > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-gray-500 font-medium">
                                {uploadProgress < 85
                                    ? `Uploading photos… ${uploadProgress}%`
                                    : uploadProgress < 100
                                        ? 'Creating listing…'
                                        : 'Done! Redirecting…'
                                }
                            </p>
                            <p className="text-xs text-teal-600 font-bold">{uploadProgress}%</p>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal-600 rounded-full transition-all duration-500"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Navigation buttons ── */}
                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2
                                border-gray-200 text-gray-600 font-semibold text-sm
                                hover:border-teal-400 hover:text-teal-700 transition-all
                                disabled:opacity-50"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back
                        </button>
                    )}

                    <div className="flex-1" />

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={goNext}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl
                                bg-teal-800 hover:bg-teal-700 text-white font-bold text-sm
                                transition-all hover:-translate-y-0.5 hover:shadow-lg
                                active:scale-95"
                        >
                            Continue
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-7 py-3 rounded-xl
                                bg-teal-800 hover:bg-teal-700 text-white font-bold text-sm
                                transition-all hover:-translate-y-0.5 hover:shadow-lg
                                active:scale-95 disabled:opacity-60 disabled:cursor-wait
                                disabled:translate-y-0"
                        >
                            {submitting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="3" strokeOpacity=".3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
                                            strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Publishing…
                                </>
                            ) : (
                                <>
                                    <RocketLaunchIcon className="w-4 h-4" />
                                    Publish Listing
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tips sidebar card ── */}
            <div className="mt-5 bg-teal-50 border border-teal-100 rounded-2xl p-5">
                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-3">
                    💡 Selling Tips
                </p>
                <ul className="flex flex-col gap-2">
                    {[
                        'Accurate condition grading avoids disputes and gets better reviews.',
                        'Uploading 8–10 clear photos increases sale likelihood by 3×.',
                        'Listings priced within the suggested range sell 2× faster.',
                        'A clean IMEI check builds instant trust with buyers.',
                        'Include all accessories and original box to justify a higher price.',
                    ].map(tip => (
                        <li key={tip} className="flex items-start gap-2 text-xs text-teal-700">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}