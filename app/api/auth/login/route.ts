/**
 * JWT 登入 API
 * 使用 Supabase 驗證密碼，簽發 JWT token
 * Token 存儲在 HttpOnly Cookie 中
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signJWT } from '@/lib/jwt-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 驗證 schema
const loginSchema = z.object({
  email: z.string().email('無效的電子郵件格式'),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
});

/**
 * POST /api/auth/login
 * 用戶登入並獲取 JWT token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: '請求參數無效',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 1. 使用 Supabase Admin Client 驗證密碼（一次性驗證）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.warn(`[Login] 登入失敗: ${email}`);
      return NextResponse.json(
        {
          success: false,
          error: '帳號或密碼錯誤',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    const user = authData.user;
    
    // 從 Supabase user_metadata 讀取角色（單一可靠來源）
    let role = (user.user_metadata?.role as 'admin' | 'owner' | 'guest') || 'guest';
    
    console.log(`[Login] 用戶 ${email} 的角色: ${role} (來自 user_metadata)`);
    
    // 驗證角色有效性
    if (!['admin', 'owner', 'guest'].includes(role)) {
      console.warn(`[Login] 無效的角色: ${role}，設為 guest`);
      role = 'guest';
    }

    // 檢查帳號是否啟用
    if (role === 'owner') {
      const owner = await prisma.owner.findUnique({
        where: { supabaseUserId: user.id },
        select: { isActive: true },
      });

      if (!owner || !owner.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: '帳號已被停用',
            code: 'ACCOUNT_DISABLED',
          },
          { status: 403 }
        );
      }
    }

    // 2. 獲取用戶權限資訊
    let propertyIds: number[] = [];

    if (role === 'owner') {
      const owner = await prisma.owner.findUnique({
        where: { supabaseUserId: user.id },
        include: {
          properties: {
            select: { propertyId: true },
          },
        },
      });

      propertyIds = owner?.properties.map((p) => p.propertyId) || [];

      if (propertyIds.length === 0) {
        console.warn(`[Login] Owner ${email} 沒有關聯任何物業`);
      }

      // 更新最後登入時間
      await prisma.owner.update({
        where: { supabaseUserId: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // 3. 簽發 JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email!,
      role,
      propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
    });

    console.log(`✅ [Login] 用戶登入成功: ${email} (${role})`);
    if (propertyIds.length > 0) {
      console.log(`   關聯物業: ${propertyIds.join(', ')}`);
    }

    // 4. 設置 HttpOnly Cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role,
        propertyIds: propertyIds.length > 0 ? propertyIds : undefined,
      },
      expiresIn: 86400, // 24小時（秒）
    });

    // 設置 HttpOnly Cookie（最安全的方式）
    response.cookies.set('auth_token', token, {
      httpOnly: true, // 防止 JavaScript 訪問（防 XSS）
      secure: process.env.NODE_ENV === 'production', // 生產環境強制 HTTPS
      sameSite: 'lax', // CSRF 保護
      maxAge: 86400, // 24小時（秒）
      path: '/', // 全站可用
    });

    return response;
  } catch (error) {
    console.error('[Login API] 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '系統錯誤',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

