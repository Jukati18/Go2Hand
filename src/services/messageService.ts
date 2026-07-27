// src/services/messageService.ts
// Read-only queries for conversations and messages.

import { createClient } from '@/lib/supabase/server'

interface ConversationRow {
    id: string
    buyer_id: string
    seller_id: string
    product_id: string
    last_message: string | null
    last_message_at: string | null
    created_at: string
    buyer: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null
    seller: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null
    product: { id: string; title: string; images: string[] | null; price: number } | null
}

export interface Conversation {
    id: string
    buyerId: string
    sellerId: string
    productId: string
    lastMessage: string | null
    lastMessageAt: string | null
    createdAt: string
    // Joined
    otherUser: {
        id: string
        username: string
        avatarUrl: string | null
    }
    product: {
        id: string
        title: string
        images: string[]
        price: number
    } | null
    unreadCount: number
}

export interface Message {
    id: string
    conversationId: string
    senderId: string
    content: string
    createdAt: string
    readAt: string | null
}

// ── Get all conversations for the current user ────────────────────
export async function getConversations(userId: string): Promise<Conversation[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('conversations')
        .select(`
      id, buyer_id, seller_id, product_id,
      last_message, last_message_at, created_at,
      buyer:users!buyer_id ( id, username, full_name, avatar_url ),
      seller:users!seller_id ( id, username, full_name, avatar_url ),
      product:products ( id, title, images, price )
    `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

    if (error || !data) {
        console.error('getConversations:', error?.message)
        return []
    }

    // Get unread counts in one query
    const ids = data.map(r => r.id)
    let unreadMap: Record<string, number> = {}

    if (ids.length > 0) {
        const { data: unread } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', ids)
            .neq('sender_id', userId)
            .is('read_at', null)

        if (unread) {
            unreadMap = unread.reduce<Record<string, number>>((acc, row) => {
                acc[row.conversation_id] = (acc[row.conversation_id] ?? 0) + 1
                return acc
            }, {})
        }
    }

    return data.map((row: any) => {
        const isBuyer = row.buyer_id === userId
        const otherUserRaw = isBuyer ? row.seller : row.buyer
        const otherUser = {
            id: otherUserRaw?.id ?? '',
            username: otherUserRaw?.username ?? otherUserRaw?.full_name ?? 'Unknown',
            avatarUrl: otherUserRaw?.avatar_url ?? null,
        }
        return {
            id: row.id,
            buyerId: row.buyer_id,
            sellerId: row.seller_id,
            productId: row.product_id,
            lastMessage: row.last_message ?? null,
            lastMessageAt: row.last_message_at ?? null,
            createdAt: row.created_at,
            otherUser,
            product: row.product
                ? {
                    id: row.product.id,
                    title: row.product.title,
                    images: row.product.images ?? [],
                    price: Number(row.product.price),
                }
                : null,
            unreadCount: unreadMap[row.id] ?? 0,
        }
    })
}

// ── Get messages in a conversation ────────────────────────────────
export async function getMessages(
    conversationId: string,
    userId: string
): Promise<{ messages: Message[]; conversation: Conversation | null }> {
    const supabase = await createClient()

    // Verify the user is a participant
    const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select(`
      id, buyer_id, seller_id, product_id,
      last_message, last_message_at, created_at,
      buyer:users!buyer_id ( id, username, full_name, avatar_url ),
      seller:users!seller_id ( id, username, full_name, avatar_url ),
      product:products ( id, title, images, price )
    `)
        .eq('id', conversationId)
        .single()

    if (convErr || !conv) return { messages: [], conversation: null }

    // Security: user must be buyer or seller
    if (conv.buyer_id !== userId && conv.seller_id !== userId) {
        return { messages: [], conversation: null }
    }

    const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, read_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

    if (msgsErr) {
        console.error('getMessages:', msgsErr.message)
        return { messages: [], conversation: null }
    }

    const isBuyer = conv.buyer_id === userId
    const rawBuyer: any = conv.buyer
    const rawSeller: any = conv.seller
    const rawProduct: any = conv.product

    const actualBuyer = Array.isArray(rawBuyer) ? rawBuyer[0] : rawBuyer
    const actualSeller = Array.isArray(rawSeller) ? rawSeller[0] : rawSeller
    const actualProduct = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct
    const otherUserRaw: ConversationRow['buyer'] | ConversationRow['seller'] = isBuyer ? actualSeller : actualBuyer
    const conversation: Conversation = {
        id: conv.id,
        buyerId: conv.buyer_id,
        sellerId: conv.seller_id,
        productId: conv.product_id,
        lastMessage: conv.last_message ?? null,
        lastMessageAt: conv.last_message_at ?? null,
        createdAt: conv.created_at,
        otherUser: {
            id: otherUserRaw?.id ?? '',
            username: otherUserRaw?.username ?? otherUserRaw?.full_name ?? 'Unknown',
            avatarUrl: otherUserRaw?.avatar_url ?? null,
        },
        product: actualProduct
            ? {
                id: actualProduct.id,
                title: actualProduct.title,
                images: actualProduct.images ?? [],
                price: Number(actualProduct.price),
            }
            : null,
        unreadCount: 0,
    }

    return {
        messages: (msgs ?? []).map(m => ({
            id: m.id,
            conversationId: m.conversation_id,
            senderId: m.sender_id,
            content: m.content,
            createdAt: m.created_at,
            readAt: m.read_at ?? null,
        })),
        conversation,
    }
}

// ── Total unread count for Navbar badge ───────────────────────────
export async function getUnreadMessageCount(userId: string): Promise<number> {
    const supabase = await createClient()

    // Get conversations where user is a participant
    const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

    if (!convs || convs.length === 0) return 0

    const ids = convs.map(c => c.id)
    const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .neq('sender_id', userId)
        .is('read_at', null)

    return count ?? 0
}