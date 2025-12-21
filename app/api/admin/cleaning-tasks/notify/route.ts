/**
 * 立即發送清掃任務通知 API
 * 需要 Admin 權限
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationManager } from '@/lib/notifications/manager';
import { getTodayInTokyo, dateToUTC, formatDateInTokyo } from '@/lib/timezone-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cleaning-tasks/notify
 * 立即發送通知
 * 
 * Body:
 * - type: 'daily' | 'weekly' | 'task' (通知類型)
 * - taskId?: string (單個任務 ID，type=task 時必填)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, taskId } = body;

    console.log(`[Manual Notify] 收到立即通知請求: type=${type}, taskId=${taskId}`);

    if (!type || !['daily', 'weekly', 'task'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '無效的通知類型' },
        { status: 400 }
      );
    }

    let tasks: any[] = [];
    let notificationType: 'DAILY' | 'WEEKLY' | 'IMMEDIATE' = 'IMMEDIATE';

    // 根據類型獲取任務
    if (type === 'daily') {
      // 當日通知 - 獲取今天需要清掃的任務（基於日本時間）
      notificationType = 'DAILY';
      
      // 使用日本時間的今天
      const todayJST = getTodayInTokyo();
      const todayStr = formatDateInTokyo(todayJST);
      
      // 轉換為 UTC 存儲格式
      const today = dateToUTC(todayStr);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      console.log(`[Manual Notify] 查詢今日任務（日本時間 ${todayStr}）`);
      console.log(`[Manual Notify] UTC 查詢範圍: ${today.toISOString()} ~ ${tomorrow.toISOString()}`);

      tasks = await prisma.cleaningTask.findMany({
        where: {
          cleaningDate: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ['PENDING', 'NOTIFIED'],
          },
        },
        include: {
          team: true,
        },
        orderBy: [
          { urgency: 'desc' },
          { cleaningDate: 'asc' },
        ],
      });

      console.log(`[Manual Notify] 找到 ${tasks.length} 個今日任務`);
    } else if (type === 'weekly') {
      // 當週通知 - 獲取未來 7 天需要清掃的任務（基於日本時間）
      notificationType = 'WEEKLY';
      
      // 使用日本時間的今天
      const todayJST = getTodayInTokyo();
      const todayStr = formatDateInTokyo(todayJST);
      
      // 轉換為 UTC 存儲格式
      const today = dateToUTC(todayStr);
      
      // 計算未來 7 天（不受星期幾影響）
      const nextWeek = new Date(today);
      nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);

      console.log(`[Manual Notify] 查詢當週任務（日本時間: ${todayStr} 起未來 7 天）`);
      console.log(`[Manual Notify] UTC 查詢範圍: ${today.toISOString()} ~ ${nextWeek.toISOString()}`);

      tasks = await prisma.cleaningTask.findMany({
        where: {
          cleaningDate: {
            gte: today,
            lt: nextWeek,
          },
          status: {
            in: ['PENDING', 'NOTIFIED'],
          },
        },
        include: {
          team: true,
        },
        orderBy: [
          { cleaningDate: 'asc' },
          { urgency: 'desc' },
        ],
      });

      console.log(`[Manual Notify] 找到 ${tasks.length} 個當週任務（未來 7 天）`);
    } else if (type === 'task') {
      // 單個任務通知
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: '缺少任務 ID' },
          { status: 400 }
        );
      }

      const task = await prisma.cleaningTask.findUnique({
        where: { id: taskId },
        include: { team: true },
      });

      if (!task) {
        return NextResponse.json(
          { success: false, error: '找不到任務' },
          { status: 404 }
        );
      }

      tasks = [task];
      console.log(`[Manual Notify] 找到單個任務: ${task.propertyName} - ${task.roomName}`);
    }

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有需要通知的任務',
        sent: 0,
      });
    }

    // 按團隊分組任務
    const tasksByTeam = new Map<string, any[]>();
    for (const task of tasks) {
      if (!task.team) continue;
      
      const teamId = task.team.id;
      if (!tasksByTeam.has(teamId)) {
        tasksByTeam.set(teamId, []);
      }
      tasksByTeam.get(teamId)!.push(task);
    }

    console.log(`[Manual Notify] 任務按 ${tasksByTeam.size} 個團隊分組`);

    // 發送通知
    let totalSent = 0;
    const results: any[] = [];

    for (const [teamId, teamTasks] of tasksByTeam.entries()) {
      const team = await prisma.cleaningTeam.findUnique({
        where: { id: teamId },
      });

      if (!team || !team.isActive) {
        console.warn(`[Manual Notify] 團隊 ${teamId} 不存在或未啟用，跳過`);
        continue;
      }

      // 構建通知消息
      const titleText = type === 'daily' 
        ? '今日清掃任務通知' 
        : type === 'weekly' 
        ? '本週清掃任務總覽'
        : '清掃任務通知';
      
      const message = {
        type: notificationType.toLowerCase() as 'daily' | 'weekly' | 'immediate',
        title: titleText,
        content: `${titleText} - 共 ${teamTasks.length} 個任務`,
        tasks: teamTasks.map((t) => ({
          id: t.id,
          propertyName: t.propertyName,
          roomName: t.roomName,
          checkOutDate: t.checkOutDate.toISOString(),
          checkOutTime: t.checkOutTime || '12:00',
          urgency: t.urgency,
          nextCheckIn: t.nextCheckIn?.toISOString(),
        })),
      };

      console.log(`[Manual Notify] 向團隊 "${team.name}" 發送通知 (${teamTasks.length} 個任務)`);

      // 發送通知到各個渠道
      const channelResults = await notificationManager.sendToTeam(team, message);
      
      // 記錄通知
      for (const result of channelResults) {
        totalSent++;
        results.push({
          team: team.name,
          channel: result.channel,
          success: result.success,
          error: result.error,
        });

        // 將渠道名稱轉換為 Prisma 枚舉值
        let channelEnum: 'WECHAT_WORK' | 'DISCORD' | 'EMAIL' | 'TELEGRAM';
        const channelLower = result.channel.toLowerCase();
        if (channelLower.includes('wechat')) {
          channelEnum = 'WECHAT_WORK';
        } else if (channelLower.includes('discord')) {
          channelEnum = 'DISCORD';
        } else if (channelLower.includes('email')) {
          channelEnum = 'EMAIL';
        } else if (channelLower.includes('telegram')) {
          channelEnum = 'TELEGRAM';
        } else {
          channelEnum = 'DISCORD'; // 預設值
        }

        // 保存到資料庫
        await prisma.cleaningNotification.create({
          data: {
            teamId: team.id,
            notificationType,
            channel: channelEnum,
            recipient: team.name,
            message: JSON.stringify(message),
            taskCount: teamTasks.length,
            status: result.success ? 'SENT' : 'FAILED',
            sentAt: result.success ? new Date() : null,
            errorMessage: result.error,
          },
        });
      }

      // 更新任務狀態為已通知
      if (type !== 'task') {
        await prisma.cleaningTask.updateMany({
          where: {
            id: { in: teamTasks.map((t) => t.id) },
            status: 'PENDING',
          },
          data: {
            status: 'NOTIFIED',
          },
        });
      }
    }

    console.log(`[Manual Notify] 通知完成，共發送 ${totalSent} 次`);

    return NextResponse.json({
      success: true,
      message: '通知已發送',
      sent: totalSent,
      results,
      taskCount: tasks.length,
    });
  } catch (error) {
    console.error('[Manual Notify] 發送通知失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '發送通知失敗',
      },
      { status: 500 }
    );
  }
}

