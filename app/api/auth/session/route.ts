import { NextResponse } from 'next/server';
import { getValidBeds24Token } from '@/lib/auth-utils';

/**
 * POST /api/auth/session
 * 初始化或刷新 session，設置 HTTP-only cookie
 */
export async function POST() {
  try {
    const result = await getValidBeds24Token();

    if (!result) {
      return NextResponse.json(
        { error: '無法獲取有效的 token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session 已創建',
    });
  } catch (error) {
    console.error('創建 session 失敗:', error);
    return NextResponse.json(
      { error: '創建 session 失敗' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session
 * 檢查 session 狀態
 */
export async function GET() {
  try {
    const result = await getValidBeds24Token();

    return NextResponse.json({
      authenticated: !!result,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
    });
  }
}

