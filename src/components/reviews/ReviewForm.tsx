'use client'

// src/components/reviews/ReviewForm.tsx
// ============================================
// REVIEW FORM MODAL
//
// FIX: handleSubmit previously only checked `ratingsComplete`,
// not which step the form was on. That meant ANY form submit
// event firing while still on step 'rate' (e.g. native button
// type quirks, an Enter keypress, or React reusing the same DOM
// button node when swapping branches without a `key`) would
// submit immediately with empty title/body — skipping the write
// step entirely. Fixed with three layered guards:
//   1. handleSubmit now hard-checks step === 'write' first.
//   2. The "Next" button explicitly calls preventDefault +
//      stopPropagation before advancing the step.
//   3. Each step's button group has a distinct `key`, so React
//      never reconciles the 'rate' buttons into the 'write'
//      buttons as if they were the same DOM node.
// ============================================

import { useState, FormEvent } from 'react'
import {
    XMarkIcon,
    ShieldCheckIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import StarPicker from './StarPicker'
import { actionSubmitReview } from '@/actions/review'

const SELLER_LABELS: Record<number, string> = {
    1: 'Very poor',
    2: 'Unsatisfactory',
    3: 'Okay',
    4: 'Good seller',
    5: 'Outstanding!',
}
const ACCURACY_LABELS: Record<number, string> = {
    1: 'Very inaccurate',
    2: 'Somewhat off',
    3: 'Mostly accurate',
    4: 'Accurate',
    5: 'Perfectly accurate',
}
const OVERALL_LABELS: Record<number, string> = {
    1: 'Terrible',
    2: 'Bad',
    3: 'Okay',
    4: 'Good',
    5: 'Excellent!',
}

interface ReviewFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    orderId: string
    sellerId: string
    productId: string
    productTitle: string
    productImage?: string
}

export default function ReviewForm({
    isOpen,
    onClose,
    onSuccess,
    orderId,
    sellerId,
    productId,
    productTitle,
}: ReviewFormProps) {
    const [overallRating,  setOverallRating]  = useState(0)
    const [sellerRating,   setSellerRating]   = useState(0)
    const [accuracyRating, setAccuracyRating] = useState(0)
    const [title,      setTitle]      = useState('')
    const [body,       setBody]       = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState<string | null>(null)
    const [step,       setStep]       = useState<'rate' | 'write'>('rate')

    const ratingsComplete = overallRating > 0 && sellerRating > 0 && accuracyRating > 0

    function handleClose() {
        if (submitting) return
        onClose()
        setTimeout(() => {
            setOverallRating(0); setSellerRating(0); setAccuracyRating(0)
            setTitle(''); setBody(''); setError(null); setStep('rate')
        }, 300)
    }

    // ── Advance to the write step ─────────────────────────────────
    // type="button" already stops this from submitting the form, but
    // preventDefault + stopPropagation add a categorical safety net
    // against any browser or React reconciliation quirk.
    function handleGoToWrite(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!ratingsComplete) return
        setStep('write')
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()

        // ── HARD GUARD ───────────────────────────────────────────
        // Only proceed when the user has explicitly reached the
        // write step by clicking Next. This is the root fix — any
        // submit event firing early (still on 'rate') is a no-op.
        if (step !== 'write') return
        if (!ratingsComplete || submitting) return

        setError(null)
        setSubmitting(true)

        const fd = new FormData()
        fd.set('order_id',        orderId)
        fd.set('seller_id',       sellerId)
        fd.set('product_id',      productId)
        fd.set('overall_rating',  String(overallRating))
        fd.set('seller_rating',   String(sellerRating))
        fd.set('accuracy_rating', String(accuracyRating))
        if (title.trim()) fd.set('title', title.trim())
        if (body.trim())  fd.set('body',  body.trim())

        const result = await actionSubmitReview(fd)
        setSubmitting(false)

        if (!result.success) {
            setError(result.error ?? 'Something went wrong')
            return
        }

        onSuccess()
        handleClose()
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                bg-black/40 backdrop-blur-sm p-4
                animate-[fadeIn_.2s_ease_both]"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden
                    animate-[slideUp_.25s_ease_both]"
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Leave a Review</h2>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{productTitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* onKeyDown guard: pressing Enter anywhere in the form while
                    still on the 'rate' step must never trigger a submit. */}
                <form
                    onSubmit={handleSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && step !== 'write') {
                            e.preventDefault()
                        }
                    }}
                >
                    <div className="px-6 py-6 flex flex-col gap-6">

                        {/* ── STEP: RATE ── */}
                        {step === 'rate' && (
                            <>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase
                                        tracking-widest mb-3">
                                        Overall Experience
                                    </p>
                                    <div className="flex justify-center">
                                        <StarPicker
                                            value={overallRating}
                                            onChange={setOverallRating}
                                            size="lg"
                                            showLabels
                                            labels={OVERALL_LABELS}
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <UserCircleIcon className="w-4 h-4 text-teal-600 shrink-0" />
                                            <p className="text-xs font-bold text-gray-700">Seller</p>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                                            Communication, honesty &amp; shipping speed
                                        </p>
                                        <StarPicker
                                            value={sellerRating}
                                            onChange={setSellerRating}
                                            size="md"
                                            showLabels
                                            labels={SELLER_LABELS}
                                        />
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <ShieldCheckIcon className="w-4 h-4 text-teal-600 shrink-0" />
                                            <p className="text-xs font-bold text-gray-700">Device Accuracy</p>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                                            Did it match the listing? Battery, grade, IMEI
                                        </p>
                                        <StarPicker
                                            value={accuracyRating}
                                            onChange={setAccuracyRating}
                                            size="md"
                                            showLabels
                                            labels={ACCURACY_LABELS}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── STEP: WRITE ── */}
                        {step === 'write' && (
                            <>
                                {/* Rating summary */}
                                <div className="flex items-center justify-around bg-teal-50
                                    border border-teal-100 rounded-xl px-4 py-3">
                                    {[
                                        { label: 'Overall',  value: overallRating  },
                                        { label: 'Seller',   value: sellerRating   },
                                        { label: 'Accuracy', value: accuracyRating },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="text-center">
                                            <p className="text-[10px] font-bold text-teal-600
                                                uppercase tracking-widest mb-0.5">
                                                {label}
                                            </p>
                                            <div className="flex gap-0.5 justify-center">
                                                {[1,2,3,4,5].map(s => (
                                                    <span key={s}
                                                        className={`text-sm ${s <= value ? 'text-amber-400' : 'text-gray-200'}`}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400
                                        uppercase tracking-widest mb-1.5">
                                        Review Title{' '}
                                        <span className="text-gray-300 font-normal normal-case">
                                            (optional)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        // A single text input inside a <form> can trigger native
                                        // implicit submission on Enter — block it explicitly.
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                                        placeholder="e.g. Great deal, battery was as listed"
                                        maxLength={100}
                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5
                                            text-sm text-gray-800 outline-none
                                            focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                                            transition placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Body */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400
                                        uppercase tracking-widest mb-1.5">
                                        Your Review{' '}
                                        <span className="text-gray-300 font-normal normal-case">
                                            (optional)
                                        </span>
                                    </label>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Tell others about your experience — the condition, shipping, seller communication..."
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5
                                            text-sm text-gray-800 outline-none resize-none
                                            focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                                            transition placeholder:text-gray-400"
                                    />
                                    <p className="text-[10px] text-gray-300 text-right mt-1">
                                        {body.length}/1000
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ── Error banner ── */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700
                                text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* key={step} forces React to fully unmount and remount this
                        button group between steps instead of reconciling the old
                        buttons in place — eliminates any chance of a click meant
                        for type="button" Next landing on type="submit" Submit. */}
                    <div className="flex items-center gap-3 px-6 pb-6" key={step}>
                        {step === 'rate' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 h-11 border-2 border-gray-200 text-gray-500
                                        font-semibold rounded-xl text-sm hover:border-gray-300
                                        transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!ratingsComplete}
                                    onClick={handleGoToWrite}
                                    className="flex-1 h-11 bg-teal-800 hover:bg-teal-700 text-white
                                        font-semibold rounded-xl text-sm transition-all
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                        hover:enabled:-translate-y-0.5 hover:enabled:shadow-md"
                                >
                                    Next: Write Review →
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setStep('rate')}
                                    className="flex-1 h-11 border-2 border-gray-200 text-gray-500
                                        font-semibold rounded-xl text-sm hover:border-gray-300
                                        transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !ratingsComplete}
                                    className="flex-1 h-11 bg-teal-800 hover:bg-teal-700 text-white
                                        font-bold rounded-xl text-sm flex items-center justify-center gap-2
                                        transition-all disabled:opacity-50 disabled:cursor-wait
                                        hover:enabled:-translate-y-0.5 hover:enabled:shadow-md"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor"
                                                    strokeWidth="3" strokeOpacity="0.3" />
                                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
                                                    strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <CheckSolid className="w-4 h-4" />
                                            Submit Review
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}