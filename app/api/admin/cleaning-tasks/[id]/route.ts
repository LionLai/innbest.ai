/**
 * 清掃任務個別操作 API
 * 需要 Admin 權限
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationManager } from '@/lib/notifications/manager';
import type { NotificationMessage } from '@/lib/notifications/base';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleaning-tasks/[id]
 * 獲取單個清掃任務詳情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.cleaningTask.findUnique({
      where: { id },
      include: {
        team: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            status: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任務不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('[Admin Cleaning Task GET] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cleaning-tasks/[id]
 * 更新清掃任務
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body;

    const task = await prisma.cleaningTask.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任務不存在' },
        { status: 404 }
      );
    }

    // 處理不同的操作
    switch (action) {
      case 'complete':
        // 標記完成
        await prisma.cleaningTask.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            notes,
          },
        });

        console.log(`✅ 標記任務完成: ${task.roomName}`);

        return NextResponse.json({
          success: true,
          message: '任務已標記為完成',
        });

      case 'resend':
        // 重新發送通知
        if (!task.team) {
          return NextResponse.json(
            { success: false, error: '任務沒有分配團隊' },
            { status: 400 }
          );
        }

        const message: NotificationMessage = {
          type: 'immediate',
          title: '清掃任務通知（重新發送）',
          content: `請儘快完成以下清掃任務`,
          tasks: [{
            id: task.id,
            propertyName: task.propertyName,
            roomName: task.roomName,
            checkOutDate: task.checkOutDate.toISOString(), // 傳遞完整 ISO 字符串
            checkOutTime: task.checkOutTime || '12:00',
            urgency: task.urgency,
            nextCheckIn: task.nextCheckIn?.toISOString(), // 傳遞完整 ISO 字符串
          }],
          urgency: task.urgency,
        };

        const results = await notificationManager.sendToTeam(task.team, message);

        console.log(`📤 重新發送通知: ${task.roomName}`);

        return NextResponse.json({
          success: true,
          message: '通知已重新發送',
          results,
        });

      case 'cancel':
        // 取消任務
        await prisma.cleaningTask.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            notes,
          },
        });

        console.log(`❌ 取消任務: ${task.roomName}`);

        return NextResponse.json({
          success: true,
          message: '任務已取消',
        });

      default:
        return NextResponse.json(
          { success: false, error: '未知的操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Admin Cleaning Task PATCH] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

