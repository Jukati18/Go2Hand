'use server'

// src/actions/adminUsers.ts
// ─────────────────────────────────────────────────────────────────
// ADMIN — USER MUTATION ACTIONS
//
// Server Actions triggered from client components (<UserTable> / Drawer)
// to update user accounts in Supabase.
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export interface AdminUpdateUserPayload {
    role?: 'buyer' | 'seller' | 'admin'
    verified?: string | null
}

export async function actionAdminUpdateUser(
    targetUserId: string,
    payload: AdminUpdateUserPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (cookiesToSet) => {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Called from Server Component context — ignore
                        }
                    },
                },
            }
        )

        // ── 1. Auth check: Caller must be logged in & be an Admin ──
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Unauthorized: Vui lòng đăng nhập lại.' }
        }

        const { data: caller } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (caller?.role !== 'admin') {
            return {
                success: false,
                error: 'Forbidden: Bạn không có quyền thực hiện hành động này.',
            }
        }

        // ── 2. Sanitize payload (chỉ update các DB columns hợp lệ) ──
        const updateData: Record<string, any> = {}
        if (payload.role !== undefined) updateData.role = payload.role
        if (payload.verified !== undefined) updateData.verified = payload.verified

        if (Object.keys(updateData).length === 0) {
            return { success: true }
        }

        // ── 3. Execute update ──────────────────────────────────────
        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', targetUserId)

        if (updateError) {
            console.error('[adminUsers] update error:', updateError.message)
            return { success: false, error: updateError.message }
        }

        // ── 4. Revalidate cache để Next.js cập nhật lại UI table ──
        revalidatePath('/admin/users')
        revalidatePath('/admin')

        return { success: true }
    } catch (err: any) {
        console.error('[adminUsers] unexpected error:', err?.message || err)
        return { success: false, error: 'Đã xảy ra lỗi hệ thống.' }
    }
}