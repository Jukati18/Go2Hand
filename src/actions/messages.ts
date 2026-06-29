'use server'

// src/actions/messages.ts
// ─────────────────────────────────────────────────────────────────
// Messaging server actions — schema matched to actual Supabase columns:
//
// conversations: id, buyer_id, seller_id, product_id,
//               last_message, last_message_at, created_at, updated_at
//
// messages: id, conversation_id, sender_id, recipient_id,
//           content, is_read, read_at, inserted_at, created_at,
//           updated_at, topic, product_id, is_system_message, is_flagged
//           (private, extension, payload, order_id, event, attachments,
//            binary_payload are nullable — omitted from insert to avoid
//            PostgREST schema cache misses on reserved/typed columns)
//
// FIX: Removed `private` from the insert payload.
//   Root cause: PostgREST caches the DB schema at startup. If the
//   `private` column was added after the last cache refresh, or if
//   the column name collides with a reserved identifier in the cache
//   key, PostgREST throws "Could not find the 'private' column".
//
//   Resolution:
//     1. Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL editor.
//     2. Remove `private` from the insert — it defaults to true in the
//        DB (DM context is always private) so we don't need to set it.
// ─────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = {
    success: boolean
    error?: string
    conversationId?: string
}

// ─────────────────────────────────────────────────────────────────
// SEND MESSAGE (or start a new conversation)
// ─────────────────────────────────────────────────────────────────
export async function actionSendMessage({
    receiverId,
    productId,
    content,
    conversationId: existingConversationId,
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
        let conversationId = existingConversationId

        // ── Find or create conversation ──────────────────────────────
        if (!conversationId) {
            const { data: existing, error: findErr } = await supabase
                .from('conversations')
                .select('id')
                .eq('buyer_id', user.id)
                .eq('seller_id', receiverId)
                .eq('product_id', productId)
                .maybeSingle()

            if (findErr) {
                console.error('[messages] find conversation error:', findErr)
                return { success: false, error: 'Failed to find conversation. Please try again.' }
            }

            if (existing) {
                conversationId = existing.id
            } else {
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
                    console.error('[messages] create conversation error:', convErr)
                    return { success: false, error: 'Failed to start conversation. Please try again.' }
                }

                conversationId = created.id
            }
        }

        // ── Insert message ────────────────────────────────────────────
        // Only include columns that are confirmed in the schema cache.
        // `private` is intentionally omitted — it should default in the DB,
        // or be added via `NOTIFY pgrst, 'reload schema'` before re-enabling.
        const { error: msgErr } = await supabase
            .from('messages')
            .insert({
                conversation_id:  conversationId,
                sender_id:        user.id,
                recipient_id:     receiverId,
                content:          trimmed,
                product_id:       productId,
                is_read:          false,
                is_system_message: false,
                is_flagged:       false,
                // `private` omitted — run `NOTIFY pgrst, 'reload schema'`
                // in Supabase SQL editor if you need to set it explicitly.
            })

        if (msgErr) {
            console.error('[messages] insert message error:', msgErr)
            return {
                success: false,
                error: `Failed to send: ${msgErr.message}`,
            }
        }

        // ── Update conversation preview ───────────────────────────────
        await supabase
            .from('conversations')
            .update({
                last_message:    trimmed.slice(0, 100),
                last_message_at: now,
                updated_at:      now,
            })
            .eq('id', conversationId)

        revalidatePath('/dashboard/messages')
        revalidatePath(`/dashboard/messages/${conversationId}`)

        return { success: true, conversationId }

    } catch (err) {
        console.error('[messages] unexpected error:', err)
        return { success: false, error: err instanceof Error ? err.message : 'Unexpected error' }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK MESSAGES AS READ
// Uses `is_read` boolean + `read_at` timestamp as per your schema.
// ─────────────────────────────────────────────────────────────────
export async function actionMarkMessagesRead(conversationId: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('messages')
        .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user.id)   // only mark messages sent TO me
        .eq('is_read', false)

    revalidatePath('/dashboard/messages')
    revalidatePath(`/dashboard/messages/${conversationId}`)
}