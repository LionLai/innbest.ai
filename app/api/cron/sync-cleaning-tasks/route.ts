/**
 * 清掃任務自動同步 Cron Job
 * 每天凌晨 2:00 執行
 * 
 * Vercel Cron: 0 2 * * *
 */

import { NextResponse } from 'next/server';
import { syncCleaningTasksFromBeds24 } from '@/lib/cleaning-auto-sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 驗證 Cron Secret（Vercel Cron 會自動帶上 authorization header）
    const authHeader = request.headers.get('authorization');
    
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('❌ Cron 認證失敗');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 [Cron] 開始執行清掃任務同步...');

    const stats = await syncCleaningTasksFromBeds24();

    console.log('✅ [Cron] 清掃任務同步完成');

    return NextResponse.json({
      success: true,
      message: '清掃任務同步完成',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Cron] 同步失敗:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '清掃任務同步失敗',
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

