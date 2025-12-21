/**
 * 清掃團隊管理 API
 * 需要 Admin 權限
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 驗證 schema
const createTeamSchema = z.object({
  name: z.string().min(1, '團隊名稱不能為空'),
  description: z.string().optional(),
  propertyIds: z.array(z.number()).min(1, '至少需要選擇一個物業'),
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
  }),
});

/**
 * GET /api/admin/cleaning-teams
 * 獲取所有清掃團隊
 */
export async function GET(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證（Admin 權限）

    const teams = await prisma.cleaningTeam.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('[Admin Cleaning Teams GET] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleaning-teams
 * 創建新的清掃團隊
 */
export async function POST(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證（Admin 權限）

    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

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

    const { name, description, propertyIds, notificationChannels } = validation.data;

    // 檢查名稱是否已存在
    const existingTeam = await prisma.cleaningTeam.findFirst({
      where: { name },
    });

    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: '團隊名稱已存在' },
        { status: 400 }
      );
    }

    // 創建團隊
    const team = await prisma.cleaningTeam.create({
      data: {
        name,
        description,
        propertyIds,
        notificationChannels: notificationChannels as any,
        isActive: true,
      },
    });

    console.log(`✅ 創建清掃團隊: ${team.name}`);
    console.log(`   負責物業: ${propertyIds.join(', ')}`);

    return NextResponse.json({
      success: true,
      data: team,
      message: '清掃團隊創建成功',
    });
  } catch (error) {
    console.error('[Admin Cleaning Teams POST] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

