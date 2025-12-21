/**
 * 測試清掃團隊通知配置
 * 需要 Admin 權限
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationManager } from '@/lib/notifications/manager';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cleaning-teams/[id]/test
 * 發送測試通知
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const team = await prisma.cleaningTeam.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: '團隊不存在' },
        { status: 404 }
      );
    }

    console.log(`🧪 測試團隊 ${team.name} 的通知配置...`);

    const results = await notificationManager.testTeamNotifications(team);

    const allSuccess = results.every(r => r.success);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ 測試完成: ${successCount}/${results.length} 個渠道成功`);

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess
        ? '所有通知渠道測試成功'
        : `${successCount}/${results.length} 個渠道測試成功`,
      results,
    });
  } catch (error) {
    console.error('[Admin Cleaning Team Test] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

