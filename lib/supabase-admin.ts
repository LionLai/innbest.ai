/**
 * Supabase Admin Client
 * 使用 Service Role Key，擁有完整的管理權限
 * ⚠️ 只能在伺服器端使用，絕對不能暴露給前端
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Admin Client - 擁有繞過 RLS 和管理用戶的權限
 * ⚠️ 僅用於後端 API，絕對不要在客戶端使用
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * 創建新的業主用戶
 * @param email - 用戶 Email
 * @param password - 初始密碼
 * @param metadata - 用戶 metadata（包含 role 等）
 */
export async function createOwnerUser(
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自動確認 Email
      user_metadata: {
        role: 'owner',
        ...metadata,
      },
    });

    if (error) {
      throw error;
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('[createOwnerUser] 錯誤:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 刪除業主用戶
 * @param userId - Supabase User ID
 */
export async function deleteOwnerUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('[deleteOwnerUser] 錯誤:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 更新業主用戶密碼
 * @param userId - Supabase User ID
 * @param newPassword - 新密碼
 */
export async function updateOwnerPassword(userId: string, newPassword: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateOwnerPassword] 錯誤:', error);
    return { success: false, error: error.message };
  }
}

