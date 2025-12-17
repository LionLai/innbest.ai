import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteOwnerUser, updateOwnerPassword } from '@/lib/supabase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 更新業主 Schema
const updateOwnerSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(6).optional(),
  propertyIds: z.array(z.number()).optional(),
});

/**
 * GET /api/admin/owners/[id]
 * 取得單一業主詳細資訊
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // ✅ Middleware 已完成 JWT 驗證

    // 獲取業主
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: {
          orderBy: { propertyId: 'asc' },
        },
        notifications: true,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, error: '找不到業主' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { owner },
    });
  } catch (error) {
    console.error('[Admin Owner GET] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/owners/[id]
 * 更新業主資訊
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // ✅ Middleware 已完成 JWT 驗證

    // 驗證輸入
    const body = await request.json();
    const validation = updateOwnerSchema.safeParse(body);

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

    const { name, nameEn, phone, isActive, newPassword, propertyIds } =
      validation.data;

    // 檢查業主是否存在
    const existingOwner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!existingOwner) {
      return NextResponse.json(
        { success: false, error: '找不到業主' },
        { status: 404 }
      );
    }

    // 如果需要更新密碼，先更新 Supabase
    if (newPassword) {
      const passwordResult = await updateOwnerPassword(
        existingOwner.supabaseUserId,
        newPassword
      );

      if (!passwordResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: `更新密碼失敗: ${passwordResult.error}`,
          },
          { status: 500 }
        );
      }
    }

    // 更新業主資訊
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const owner = await prisma.owner.update({
      where: { id },
      data: updateData,
      include: {
        properties: true,
      },
    });

    // 如果需要更新關聯物業
    if (propertyIds !== undefined) {
      // 先刪除現有關聯
      await prisma.ownerProperty.deleteMany({
        where: { ownerId: id },
      });

      // 創建新關聯
      await prisma.ownerProperty.createMany({
        data: propertyIds.map((propertyId) => ({
          ownerId: id,
          propertyId,
          canViewBookings: true,
          canViewRevenue: true,
          canViewStats: true,
        })),
      });
    }

    // 重新獲取完整資料
    const updatedOwner = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { owner: updatedOwner },
      message: '業主資訊已更新',
    });
  } catch (error) {
    console.error('[Admin Owner PUT] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/owners/[id]
 * 刪除業主（同時刪除 Supabase 用戶）
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // ✅ Middleware 已完成 JWT 驗證

    // 檢查業主是否存在
    const owner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, error: '找不到業主' },
        { status: 404 }
      );
    }

    // 1. 先刪除 Supabase 用戶
    const deleteUserResult = await deleteOwnerUser(owner.supabaseUserId);

    if (!deleteUserResult.success) {
      console.warn(
        `⚠️ 刪除 Supabase 用戶失敗: ${deleteUserResult.error}，將繼續刪除資料庫記錄`
      );
    }

    // 2. 刪除資料庫記錄（Cascade 會自動刪除關聯的 properties 和 notifications）
    await prisma.owner.delete({
      where: { id },
    });

    console.log(`✅ 已刪除業主: ${owner.name} (${owner.email})`);

    return NextResponse.json({
      success: true,
      message: '業主已刪除',
    });
  } catch (error) {
    console.error('[Admin Owner DELETE] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

