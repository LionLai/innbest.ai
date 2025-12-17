/**
 * JWT Token 刷新 API
 * 讀取舊 token 並簽發新 token
 */

import { NextResponse } from 'next/server';
import { refreshJWT } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh
 * 刷新 JWT token（延長有效期）
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const oldToken = cookieStore.get('auth_token')?.value;

    if (!oldToken) {
      return NextResponse.json(
        {
          success: false,
          error: '未找到 token',
          code: 'NO_TOKEN',
        },
        { status: 401 }
      );
    }

    // 刷新 token
    const newToken = await refreshJWT(oldToken);

    if (!newToken) {
      // Token 無效或已過期，清除 cookie
      const response = NextResponse.json(
        {
          success: false,
          error: 'Token 無效或已過期',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );

      response.cookies.delete('auth_token');
      return response;
    }

    console.log('✅ [Refresh] Token 已刷新');

    // 返回新 token 並更新 cookie
    const response = NextResponse.json({
      success: true,
      expiresIn: 86400, // 24小時
    });

    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Refresh API] 錯誤:', error);
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

