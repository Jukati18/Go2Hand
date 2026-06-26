// src/components/contact/ContactForm.tsx
'use client'

import { useState } from 'react'
import {
    PaperAirplaneIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const TOPICS = [
    'General Inquiry',
    'Escrow & Payment Issue',
    'IMEI / Device Verification',
    'Report a Listing / Scam',
    'Account & Profile Help',
    'Partnership / Media'
]

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        orderId: '',
        topic: TOPICS[0],
        message: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            // Giả lập call API gửi contact (Thay bằng service thực tế của bạn sau này)
            await new Promise((resolve) => setTimeout(resolve, 1200))
            setIsSubmitted(true)
        } catch {
            setError('Something went wrong. Please try emailing us directly.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                    <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Message received!</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
                    We have routed your ticket to the appropriate department. Our support team
                    typically responds within <span className="font-bold text-gray-800">2 hours</span> during business days.
                </p>
                <button
                    onClick={() => {
                        setIsSubmitted(false)
                        setFormData({ fullName: '', email: '', orderId: '', topic: TOPICS[0], message: '' })
                    }}
                    className="text-xs font-bold text-teal-700 uppercase tracking-widest hover:underline"
                >
                    Send another message
                </button>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-2">Send us a message</h3>
            <p className="text-xs text-gray-500 mb-6">
                Fill out the form below. If this is regarding an active transaction, please include your Order ID.
            </p>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-xs">
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="Nguyen Van A"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm 
                focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/10 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm 
                focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/10 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Help Topic
                        </label>
                        <select
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white
                focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/10 transition-all"
                        >
                            {TOPICS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Order / Device ID <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. ORD-98234"
                            value={formData.orderId}
                            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono
                focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/10 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        rows={4}
                        placeholder="Please describe your issue in detail..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 p-3.5 text-sm leading-relaxed
              focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/10 transition-all resize-y"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-700 hover:to-teal-600 
            text-white font-bold py-3.5 px-6 rounded-xl shadow-sm transition-all duration-200
            flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                >
                    {isSubmitting ? (
                        <span>Sending ticket...</span>
                    ) : (
                        <>
                            <span>Submit Ticket</span>
                            <PaperAirplaneIcon className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}