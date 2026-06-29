'use client'

// src/components/messages/ConversationThread.tsx
// Real-time conversation view with Supabase subscription for live updates.

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { actionSendMessage, actionMarkMessagesRead } from '@/actions/messages'
import type { Conversation, Message } from '@/services/messageService'

interface ConversationThreadProps {
    currentUserId: string
    conversation: Conversation
    initialMessages: Message[]
}

export default function ConversationThread({
    currentUserId,
    conversation,
    initialMessages,
}: ConversationThreadProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Mark messages as read on mount
    useEffect(() => {
        actionMarkMessagesRead(conversation.id)
    }, [conversation.id])

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Real-time subscription for new messages
    useEffect(() => {
        const channel = supabase
            .channel(`messages:${conversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as any
                    // Only add if not already in list (prevents duplicate from optimistic UI)
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, {
                            id: newMsg.id,
                            conversationId: newMsg.conversation_id,
                            senderId: newMsg.sender_id,
                            content: newMsg.content,
                            createdAt: newMsg.created_at,
                            readAt: newMsg.read_at ?? null,
                        }]
                    })
                    // Mark read if message is from the other user
                    if (newMsg.sender_id !== currentUserId) {
                        actionMarkMessagesRead(conversation.id)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [conversation.id, currentUserId, supabase])

    const handleSend = useCallback(async (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim() || sending) return

        setSending(true)
        setError(null)

        const result = await actionSendMessage({
            receiverId: conversation.otherUser.id,
            productId: conversation.productId,
            content: input.trim(),
            conversationId: conversation.id,
        })

        setSending(false)

        if (!result.success) {
            setError(result.error ?? 'Failed to send')
            return
        }

        setInput('')
    }, [input, sending, conversation])

    // Group messages by date for date separators
    function formatTime(iso: string) {
        return new Date(iso).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        })
    }

    function formatDate(iso: string) {
        const d = new Date(iso)
        const today = new Date()
        if (d.toDateString() === today.toDateString()) return 'Today'
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    let lastDate = ''

    return (
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 flex flex-col"
            style={{ height: 'calc(100vh - 130px)' }}>

            {/* ── Header ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5
        flex items-center gap-3 mb-4 shrink-0">
                <Link href="/dashboard/messages"
                    className="w-8 h-8 flex items-center justify-center rounded-full
            text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                </Link>

                {/* Seller avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400
          flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {conversation.otherUser.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.otherUser.username}
                    </p>
                    {conversation.product && (
                        <p className="text-[11px] text-gray-400 truncate">
                            Re: {conversation.product.title}
                        </p>
                    )}
                </div>

                {/* Product thumbnail link */}
                {conversation.product && (
                    <Link
                        href={`/devices/${conversation.product.id}`}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200
              hover:border-teal-300 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                        {conversation.product.images?.[0] && (
                            <Image
                                src={conversation.product.images[0]}
                                alt={conversation.product.title}
                                width={28}
                                height={28}
                                sizes="28px"
                                className="w-7 h-7 object-contain"
                            />
                        )}
                        <div className="hidden sm:block">
                            <p className="text-[10px] font-bold text-teal-700 flex items-center gap-1">
                                <ShoppingBagIcon className="w-3 h-3" />
                                View Listing
                            </p>
                            <p className="text-[10px] text-gray-500">${conversation.product.price}</p>
                        </div>
                    </Link>
                )}
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100
        shadow-sm px-4 py-4 flex flex-col gap-1 mb-4 min-h-0">

                {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-center py-12">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 mb-1">Start the conversation</p>
                            <p className="text-xs text-gray-400">
                                Send your first message to {conversation.otherUser.username}
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId
                    const dateLabel = formatDate(msg.createdAt)
                    const showDateSep = dateLabel !== lastDate
                    lastDate = dateLabel

                    return (
                        <div key={msg.id}>
                            {/* Date separator */}
                            {showDateSep && (
                                <div className="flex items-center gap-3 my-3">
                                    <div className="flex-1 h-px bg-gray-100" />
                                    <span className="text-[11px] text-gray-400 font-medium shrink-0">{dateLabel}</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                            )}

                            {/* Message bubble */}
                            <div className={`flex mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                  ${isMe
                                        ? 'bg-teal-800 text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                                        {formatTime(msg.createdAt)}
                                        {isMe && msg.readAt && (
                                            <span className="ml-1">· Read</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}

                <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <form onSubmit={handleSend}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm
          px-3 py-3 flex items-end gap-2 shrink-0">
                <textarea
                    value={input}
                    onChange={e => { setInput(e.target.value); setError(null) }}
                    onKeyDown={e => {
                        // Cmd/Ctrl+Enter sends the message
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault()
                            handleSend(e as any)
                        }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    style={{ resize: 'none', minHeight: '40px', maxHeight: '120px' }}
                    className="flex-1 text-sm text-gray-800 bg-transparent outline-none
            placeholder:text-gray-400 leading-relaxed py-1.5"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 bg-teal-800 hover:bg-teal-700 text-white rounded-xl
            flex items-center justify-center shrink-0 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
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
                </button>
            </form>

            {error && (
                <p className="text-xs text-red-500 mt-1.5 px-1">{error}</p>
            )}

            <p className="text-[10px] text-gray-400 text-center mt-2">
                Press Ctrl+Enter to send
            </p>
        </div>
    )
}