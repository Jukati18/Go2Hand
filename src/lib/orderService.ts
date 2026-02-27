// lib/orderService.ts
import { supabase } from './supabaseClient'

export async function createOrder(orderData: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getUserOrders(userId: string, role: 'buyer' | 'seller') {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id'
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      product:products (id, title, images, price),
      ${role === 'buyer' ? 'seller:users!seller_id' : 'buyer:users!buyer_id'} (
        id, username, avatar_url
      )
    `)
        .eq(column, userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    return data
}