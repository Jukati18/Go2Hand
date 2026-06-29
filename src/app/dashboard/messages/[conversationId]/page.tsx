// src/app/dashboard/messages/[conversationId]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getMessages } from '@/services/messageService'
import ConversationThread from '@/components/messages/ConversationThread'

interface Props {
    params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
    const { conversationId } = await params

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/login?next=/dashboard/messages/${conversationId}`)

    const { messages, conversation } = await getMessages(conversationId, user.id)
    if (!conversation) notFound()

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <ConversationThread
                currentUserId={user.id}
                conversation={conversation}
                initialMessages={messages}
            />
            <Footer />
        </div>
    )
}