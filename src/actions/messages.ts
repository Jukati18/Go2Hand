'use server'

// src/actions/messages.ts
// Conversations: id, buyer_id, seller_id, product_id,
//                last_message, last_message_at, created_at
// Messages:      id, conversation_id, sender_id, content,
//                created_at, read_at

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { success: boolean; error?: string; conversationId?: string }

export async function actionSendMessage({
    receiverId,
    productId,
    content,
    conversationId: existingId,
}: {
    receiverId: string
    productId: string
    content: string
    conversationId?: string
}): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'You must be logged in to send messages' }
    if (user.id === receiverId) return { success: false, error: 'You cannot message yourself' }

    const trimmed = content.trim()
    if (!trimmed) return { success: false, error: 'Message cannot be empty' }
    if (trimmed.length > 2000) return { success: false, error: 'Message is too long (max 2000 characters)' }

    const now = new Date().toISOString()

    try {
        let conversationId = existingId

        if (!conversationId) {
            // Find existing conversation for this buyer+seller+product combo
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('buyer_id', user.id)
                .eq('seller_id', receiverId)
                .eq('product_id', productId)
                .maybeSingle()

            if (existing) {
                conversationId = existing.id
            } else {
                // Create new conversation
                const { data: created, error: convErr } = await supabase
                    .from('conversations')
                    .insert({
                        buyer_id: user.id,
                        seller_id: receiverId,
                        product_id: productId,
                        last_message: trimmed.slice(0, 100),
                        last_message_at: now,
                    })
                    .select('id')
                    .single()

                if (convErr || !created) {
                    return { success: false, error: 'Failed to start conversation. Please try again.' }
                }
                conversationId = created.id
            }
        }

        // Insert the message
        const { error: msgErr } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: trimmed,
        })

        if (msgErr) return { success: false, error: 'Failed to send message. Please try again.' }

        // Update conversation preview snippet
        await supabase
            .from('conversations')
            .update({ last_message: trimmed.slice(0, 100), last_message_at: now })
            .eq('id', conversationId)

        revalidatePath('/dashboard/messages')
        revalidatePath(`/dashboard/messages/${conversationId}`)

        return { success: true, conversationId }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unexpected error' }
    }
}

export async function actionMarkMessagesRead(conversationId: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null)

    revalidatePath('/dashboard/messages')
    revalidatePath(`/dashboard/messages/${conversationId}`)
}