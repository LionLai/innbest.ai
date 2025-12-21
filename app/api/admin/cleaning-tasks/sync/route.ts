import { NextResponse } from "next/server";
import { syncCleaningTasksFromBeds24 } from "@/lib/cleaning-auto-sync";

export const dynamic = 'force-dynamic';

/**
 * 手動同步清掃任務
 * POST /api/admin/cleaning-tasks/sync
 * 
 * 從 Beds24 同步訂單並生成清掃任務
 * ✅ Middleware 已完成 JWT 驗證（Admin 權限）
 */
export async function POST(request: Request) {
  try {
    console.log('[Manual Sync] 開始手動同步清掃任務...');

    // 執行同步
    const result = await syncCleaningTasksFromBeds24();

    console.log('[Manual Sync] 同步完成:', result);

    return NextResponse.json({
      success: true,
      message: '同步完成',
      data: result,
    });
  } catch (error) {
    console.error('[Manual Sync] 同步失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '同步失敗',
      },
      { status: 500 }
    );
  }
}

