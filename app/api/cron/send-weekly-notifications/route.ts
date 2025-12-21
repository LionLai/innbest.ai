/**
 * 發送每週清掃通知 Cron Job
 * 每週一早上 8:00 執行
 * 
 * Vercel Cron: 0 8 * * 1
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationManager } from '@/lib/notifications/manager';
import type { NotificationMessage, CleaningTaskSummary } from '@/lib/notifications/base';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 驗證 Cron Secret
    const authHeader = request.headers.get('authorization');
    
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('❌ Cron 認證失敗');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 [Cron] 開始發送每週清掃通知...');

    // 獲取本週的所有清掃任務（週一到週日）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const weeklyTasks = await prisma.cleaningTask.findMany({
      where: {
        cleaningDate: {
          gte: today,
          lt: nextWeek,
        },
        status: { in: ['PENDING', 'NOTIFIED'] },
      },
      include: {
        team: true,
      },
      orderBy: [
        { cleaningDate: 'asc' },
        { urgency: 'desc' },
      ],
    });

    console.log(`📋 本週共有 ${weeklyTasks.length} 個清掃任務`);

    if (weeklyTasks.length === 0) {
      console.log('✨ 本週無清掃任務，跳過通知');
      return NextResponse.json({
        success: true,
        message: '本週無清掃任務',
        taskCount: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // 按團隊分組
    const tasksByTeam = new Map<string, typeof weeklyTasks>();
    
    for (const task of weeklyTasks) {
      if (!task.team) continue;
      
      const teamId = task.team.id;
      if (!tasksByTeam.has(teamId)) {
        tasksByTeam.set(teamId, []);
      }
      tasksByTeam.get(teamId)!.push(task);
    }

    const results = [];

    // 為每個團隊發送通知
    for (const [teamId, tasks] of tasksByTeam.entries()) {
      const team = tasks[0].team;
      if (!team) continue;

      const taskSummaries: CleaningTaskSummary[] = tasks.map(task => ({
        id: task.id,
        propertyName: task.propertyName,
        roomName: task.roomName,
        checkOutDate: task.checkOutDate.toISOString().split('T')[0],
        checkOutTime: task.checkOutTime || '12:00',
        urgency: task.urgency,
        nextCheckIn: task.nextCheckIn?.toISOString().split('T')[0],
      }));

      const message: NotificationMessage = {
        type: 'weekly',
        title: '本週清掃任務概覽',
        content: `${team.name} 本週共有 ${tasks.length} 個清掃任務`,
        tasks: taskSummaries,
      };

      const sendResults = await notificationManager.sendToTeam(team, message);
      
      results.push({
        teamId,
        teamName: team.name,
        taskCount: tasks.length,
        results: sendResults,
      });

      console.log(`✅ 已通知團隊 ${team.name}，共 ${tasks.length} 個任務`);
    }

    console.log('✅ [Cron] 每週通知發送完成');

    return NextResponse.json({
      success: true,
      message: '每週通知發送完成',
      teamCount: tasksByTeam.size,
      totalTasks: weeklyTasks.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Cron] 每週通知發送失敗:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '每週通知發送失敗',
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

