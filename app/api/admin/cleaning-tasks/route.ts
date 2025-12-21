/**
 * 清掃任務管理 API
 * 需要 Admin 權限
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerManualSync } from '@/lib/cleaning-auto-sync';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleaning-tasks
 * 獲取清掃任務列表
 * 
 * Query Parameters:
 * - date: 指定日期 (YYYY-MM-DD)
 * - startDate: 開始日期
 * - endDate: 結束日期
 * - status: 任務狀態
 * - propertyId: 物業 ID
 * - teamId: 團隊 ID
 * - page: 頁碼 (預設 1)
 * - pageSize: 每頁數量 (預設 20)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    const teamId = searchParams.get('teamId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 構建查詢條件
    const where: any = {};

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.cleaningDate = {
        gte: targetDate,
        lt: nextDay,
      };
    } else if (startDate && endDate) {
      where.cleaningDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (propertyId) {
      where.propertyId = parseInt(propertyId);
    }

    if (teamId) {
      where.teamId = teamId;
    }

    // 獲取總數
    const total = await prisma.cleaningTask.count({ where });

    // 獲取任務列表
    const tasks = await prisma.cleaningTask.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { cleaningDate: 'asc' },
        { urgency: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('[Admin Cleaning Tasks GET] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleaning-tasks
 * 手動觸發同步
 */
export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === 'sync') {
      console.log('🔧 手動觸發清掃任務同步...');
      const stats = await triggerManualSync();

      return NextResponse.json({
        success: true,
        message: '同步完成',
        stats,
      });
    }

    return NextResponse.json(
      { success: false, error: '未知的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Admin Cleaning Tasks POST] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

