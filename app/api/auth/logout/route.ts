/**
 * JWT 登出 API
 * 清除 HttpOnly Cookie
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 * 用戶登出（清除 token cookie）
 */
export async function POST(request: Request) {
  try {
    console.log('🚪 [Logout] 用戶登出');

    const response = NextResponse.json({
      success: true,
      message: '登出成功',
    });

    // 清除 HttpOnly Cookie
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('[Logout API] 錯誤:', error);
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

