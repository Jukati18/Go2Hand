'use client'

// src/components/messages/MessageModal.tsx
// ─────────────────────────────────────────────────────────────────
// Modal that opens when buyer clicks "Message Seller" on device detail.
// On success: shows confirmation with link to full inbox.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    XMarkIcon,
    PaperAirplaneIcon,
    ChatBubbleLeftEllipsisIcon,
    CheckCircleIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { actionSendMessage } from '@/actions/messages'

interface MessageModalProps {
    isOpen: boolean
    onClose: () => void
    sellerId: string
    sellerName: string
    sellerAvatarColor: string
    sellerInitials: string
    productId: string
    productTitle: string
    productImage?: string
    productPrice: number
}

// Quick starter questions to help buyers send faster
const QUICK_MESSAGES = [
    'Is this item still available?',
    'Can you do a lower price?',
    'Does the battery health match what is listed?',
    'Can you provide more photos?',
]

export default function MessageModal({
    isOpen,
    onClose,
    sellerId,
    sellerName,
    sellerAvatarColor,
    sellerInitials,
    productId,
    productTitle,
    productImage,
    productPrice,
}: MessageModalProps) {
    const { isAuthenticated } = useAuth()
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sentConversationId, setSentConversationId] = useState<string | null>(null)

    const charCount = message.length
    const isOverLimit = charCount > 2000

    const handleQuickMessage = useCallback((text: string) => {
        setMessage(text)
        setError(null)
    }, [])

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault()
        if (!message.trim() || sending || isOverLimit) return

        setSending(true)
        setError(null)

        const result = await actionSendMessage({
            receiverId: sellerId,
            productId,
            content: message,
        })

        setSending(false)

        if (!result.success) {
            setError(result.error ?? 'Failed to send message')
            return
        }

        setSentConversationId(result.conversationId ?? null)
    }, [message, sending, isOverLimit, sellerId, productId])

    const handleClose = useCallback(() => {
        onClose()
        // Reset state after animation completes
        setTimeout(() => {
            setMessage('')
            setError(null)
            setSentConversationId(null)
            setSending(false)
        }, 300)
    }, [onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
        bg-black/40 backdrop-blur-sm p-4
        animate-[fadeIn_.2s_ease_both]"
            onClick={e => e.target === e.currentTarget && handleClose()}
        >
            <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden
        animate-[slideUp_.25s_ease_both]">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-teal-600" />
                        <h2 className="text-sm font-bold text-gray-900">Message Seller</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full
              text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* ── SUCCESS STATE ── */}
                {sentConversationId ? (
                    <div className="px-6 py-8 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-4
              border border-teal-100">
                            <CheckCircleIcon className="w-7 h-7 text-teal-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Message sent!</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Your message has been sent to {sellerName}. You&apos;ll be notified when they reply.
                        </p>
                        <div className="flex flex-col gap-2 w-full">
                            <Link
                                href={`/dashboard/messages/${sentConversationId}`}
                                className="w-full h-11 bg-teal-800 hover:bg-teal-700 text-white font-semibold
                  rounded-xl flex items-center justify-center gap-2 text-sm
                  transition-all hover:-translate-y-0.5 hover:shadow-md"
                                onClick={handleClose}
                            >
                                View Conversation
                                <ArrowRightIcon className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={handleClose}
                                className="w-full h-10 text-gray-500 text-sm font-medium
                  hover:text-gray-700 transition-colors"
                            >
                                Continue browsing
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Seller + Product Preview ── */}
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                {/* Seller avatar */}
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${sellerAvatarColor}
                  flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                    {sellerInitials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{sellerName}</p>
                                    <p className="text-xs text-gray-400">Typically responds in &lt; 2 hrs</p>
                                </div>
                                {/* Product thumbnail */}
                                {productImage && (
                                    <div className="w-11 h-11 rounded-xl bg-white border border-gray-200
                    flex items-center justify-center overflow-hidden shrink-0">
                                        <Image
                                            src={productImage}
                                            alt={productTitle}
                                            width={44}
                                            height={44}
                                            sizes="44px"
                                            className="w-full h-full object-contain p-0.5"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mt-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between">
                                <p className="text-xs text-gray-700 font-medium truncate mr-2">{productTitle}</p>
                                <span className="text-xs font-bold text-teal-700 shrink-0">${productPrice}</span>
                            </div>
                        </div>

                        {/* ── Not logged in state ── */}
                        {!isAuthenticated ? (
                            <div className="px-5 py-8 text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    You need to be logged in to message sellers.
                                </p>
                                <Link
                                    href="/login?next=/devices"
                                    className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                    text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                    transition-all hover:shadow-md"
                                    onClick={handleClose}
                                >
                                    Sign In to Message
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="px-5 py-4">

                                    {/* Quick replies */}
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                                        Quick messages
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {QUICK_MESSAGES.map(q => (
                                            <button
                                                key={q}
                                                type="button"
                                                onClick={() => handleQuickMessage(q)}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150
                          ${message === q
                                                        ? 'bg-teal-50 border-teal-400 text-teal-800 font-semibold'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700'
                                                    }`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message textarea */}
                                    <div>
                                        <textarea
                                            value={message}
                                            onChange={e => { setMessage(e.target.value); setError(null) }}
                                            placeholder="Write your message here..."
                                            rows={4}
                                            className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-800
                        outline-none resize-none transition
                        focus:ring-2 focus:ring-teal-100 placeholder:text-gray-400
                        ${isOverLimit
                                                    ? 'border-red-400 focus:border-red-400'
                                                    : 'border-gray-200 focus:border-teal-500'
                                                }`}
                                        />
                                        <div className="flex items-center justify-between mt-1">
                                            {error && (
                                                <p className="text-xs text-red-500">{error}</p>
                                            )}
                                            <span className={`text-[11px] ml-auto
                        ${isOverLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                {charCount}/2000
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-5 pb-5 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 h-11 border-2 border-gray-200 text-gray-500 font-semibold
                      rounded-xl text-sm hover:border-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!message.trim() || sending || isOverLimit}
                                        className="flex-1 h-11 bg-teal-800 hover:bg-teal-700 text-white font-bold
                      rounded-xl text-sm flex items-center justify-center gap-2
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      hover:enabled:-translate-y-0.5 hover:enabled:shadow-md"
                                    >
                                        {sending ? (
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                        ) : (
                                            <PaperAirplaneIcon className="w-4 h-4" />
                                        )}
                                        {sending ? 'Sending…' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}