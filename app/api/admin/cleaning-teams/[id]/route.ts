/**
 * 清掃團隊個別操作 API
 * 需要 Admin 權限
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 驗證 schema
const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  propertyIds: z.array(z.number()).min(1).optional(),
  notificationChannels: z.object({
    wechat: z.object({
      enabled: z.boolean(),
      webhookUrl: z.string().optional(),
    }).optional(),
    discord: z.object({
      enabled: z.boolean(),
      webhookUrl: z.string().optional(),
    }).optional(),
    email: z.object({
      enabled: z.boolean(),
      recipients: z.array(z.string().email()).optional(),
    }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/cleaning-teams/[id]
 * 獲取單個清掃團隊詳情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const team = await prisma.cleaningTeam.findUnique({
      where: { id },
      include: {
        tasks: {
          take: 10,
          orderBy: { cleaningDate: 'desc' },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: '團隊不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('[Admin Cleaning Team GET] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cleaning-teams/[id]
 * 更新清掃團隊
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: '參數驗證失敗',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const team = await prisma.cleaningTeam.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: '團隊不存在' },
        { status: 404 }
      );
    }

    const updatedTeam = await prisma.cleaningTeam.update({
      where: { id },
      data: validation.data as any,
    });

    console.log(`✅ 更新清掃團隊: ${updatedTeam.name}`);

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: '清掃團隊更新成功',
    });
  } catch (error) {
    console.error('[Admin Cleaning Team PATCH] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cleaning-teams/[id]
 * 刪除清掃團隊
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const team = await prisma.cleaningTeam.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: '團隊不存在' },
        { status: 404 }
      );
    }

    // 檢查是否有未完成的任務
    const pendingTasks = await prisma.cleaningTask.count({
      where: {
        teamId: id,
        status: { in: ['PENDING', 'NOTIFIED'] },
      },
    });

    if (pendingTasks > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `無法刪除團隊，還有 ${pendingTasks} 個未完成的清掃任務`,
        },
        { status: 400 }
      );
    }

    await prisma.cleaningTeam.delete({
      where: { id },
    });

    console.log(`✅ 刪除清掃團隊: ${team.name}`);

    return NextResponse.json({
      success: true,
      message: '清掃團隊刪除成功',
    });
  } catch (error) {
    console.error('[Admin Cleaning Team DELETE] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

