// src/app/dashboard/messages/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getConversations } from '@/services/messageService'
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

export default async function MessagesPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/dashboard/messages')

    const conversations = await getConversations(user.id)

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-teal-600" />
                        Messages
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {conversations.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ChatBubbleLeftEllipsisIcon className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="font-semibold text-gray-700 mb-1">No messages yet</p>
                        <p className="text-sm text-gray-400 mb-5">
                            When you message a seller or receive a message, it will appear here.
                        </p>
                        <Link href="/devices"
                            className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                            Browse Devices
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {conversations.map(conv => (
                            <Link
                                key={conv.id}
                                href={`/dashboard/messages/${conv.id}`}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                  hover:border-teal-200 hover:shadow-md transition-all duration-200 group"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400
                    flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {conv.otherUser.username.slice(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-sm font-semibold text-gray-900 truncate">
                                                {conv.otherUser.username}
                                            </span>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                {conv.unreadCount > 0 && (
                                                    <span className="min-w-[20px] h-5 px-1.5 bg-teal-600 text-white
                            text-[10px] font-bold rounded-full flex items-center justify-center">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                                {conv.lastMessageAt && (
                                                    <span className="text-[11px] text-gray-400">
                                                        {new Date(conv.lastMessageAt).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {conv.product && (
                                            <p className="text-[11px] text-teal-600 font-medium truncate mb-0.5">
                                                Re: {conv.product.title}
                                            </p>
                                        )}
                                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                            {conv.lastMessage ?? 'No messages yet'}
                                        </p>
                                    </div>

                                    {/* Product thumbnail */}
                                    {conv.product?.images?.[0] && (
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100
                      flex items-center justify-center overflow-hidden shrink-0">
                                            <Image
                                                src={conv.product.images[0]}
                                                alt={conv.product.title}
                                                width={40}
                                                height={40}
                                                sizes="40px"
                                                className="w-full h-full object-contain p-0.5"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}

export const metadata = { title: 'Messages — Go2Hand' }