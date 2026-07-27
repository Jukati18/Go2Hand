// src/services/messageService.ts
// Read-only queries for conversations and messages.

import { createClient } from '@/lib/supabase/server'

// ── Raw interfaces to handle Supabase's array inference safely ────
interface RawUser {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
}

interface RawProduct {
    id: string
    title: string
    images: string[] | null
    price: number
}

interface RawConvRow {
    id: string
    buyer_id: string
    seller_id: string
    product_id: string
    last_message: string | null
    last_message_at: string | null
    created_at: string
    buyer?: RawUser | RawUser[] | null
    seller?: RawUser | RawUser[] | null
    product?: RawProduct | RawProduct[] | null
}

// ── Exported interfaces ───────────────────────────────────────────
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

    // Safely map over the data, handling Supabase's array inference
    return (data as unknown[]).map((item) => {
        const row = item as RawConvRow
        
        const rawBuyer = Array.isArray(row.buyer) ? row.buyer[0] : row.buyer
        const rawSeller = Array.isArray(row.seller) ? row.seller[0] : row.seller
        const rawProduct = Array.isArray(row.product) ? row.product[0] : row.product

        const isBuyer = row.buyer_id === userId
        const otherUserRaw = isBuyer ? rawSeller : rawBuyer
        
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
            product: rawProduct
                ? {
                    id: rawProduct.id,
                    title: rawProduct.title,
                    images: rawProduct.images ?? [],
                    price: Number(rawProduct.price),
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

    // Bypass strict Supabase inferences safely using our RawConvRow interface
    const rawConv = conv as unknown as RawConvRow
    
    const isBuyer = rawConv.buyer_id === userId
    const rawBuyer = Array.isArray(rawConv.buyer) ? rawConv.buyer[0] : rawConv.buyer
    const rawSeller = Array.isArray(rawConv.seller) ? rawConv.seller[0] : rawConv.seller
    const rawProduct = Array.isArray(rawConv.product) ? rawConv.product[0] : rawConv.product
    
    const otherUserRaw = isBuyer ? rawSeller : rawBuyer

    const conversation: Conversation = {
        id: rawConv.id,
        buyerId: rawConv.buyer_id,
        sellerId: rawConv.seller_id,
        productId: rawConv.product_id,
        lastMessage: rawConv.last_message ?? null,
        lastMessageAt: rawConv.last_message_at ?? null,
        createdAt: rawConv.created_at,
        otherUser: {
            id: otherUserRaw?.id ?? '',
            username: otherUserRaw?.username ?? otherUserRaw?.full_name ?? 'Unknown',
            avatarUrl: otherUserRaw?.avatar_url ?? null,
        },
        product: rawProduct
            ? {
                id: rawProduct.id,
                title: rawProduct.title,
                images: rawProduct.images ?? [],
                price: Number(rawProduct.price),
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