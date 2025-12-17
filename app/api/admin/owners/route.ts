import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOwnerUser } from '@/lib/supabase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 輸入驗證 Schema
const createOwnerSchema = z.object({
  email: z.string().email('Email 格式錯誤'),
  name: z.string().min(1, '姓名不能為空'),
  nameEn: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
  propertyIds: z.array(z.number()).min(1, '至少需要關聯一個物業'),
});

/**
 * GET /api/admin/owners
 * 取得所有業主列表
 */
export async function GET(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    
    // 獲取所有業主
    const owners = await prisma.owner.findMany({
      include: {
        properties: {
          orderBy: { propertyId: 'asc' },
        },
        _count: {
          select: { properties: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { owners },
    });
  } catch (error) {
    console.error('[Admin Owners GET] 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/owners
 * 創建新業主（自動創建 Supabase 用戶）
 */
export async function POST(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    
    // 驗證輸入
    const body = await request.json();
    const validation = createOwnerSchema.safeParse(body);

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

    const { email, name, nameEn, phone, password, propertyIds } = validation.data;

    // 1. 檢查 Email 是否已存在
    const existingOwner = await prisma.owner.findUnique({
      where: { email },
    });

    if (existingOwner) {
      return NextResponse.json(
        { success: false, error: '此 Email 已被使用' },
        { status: 400 }
      );
    }

    // 2. 在 Supabase 創建用戶
    const userResult = await createOwnerUser(email, password, {
      name,
      nameEn,
    });

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: `創建 Supabase 用戶失敗: ${userResult.error}`,
        },
        { status: 500 }
      );
    }

    const supabaseUserId = userResult.user.id;

    // 3. 創建 Owner 記錄
    const owner = await prisma.owner.create({
      data: {
        email,
        name,
        nameEn,
        phone,
        supabaseUserId,
        isActive: true,
        properties: {
          create: propertyIds.map((propertyId) => ({
            propertyId,
            canViewBookings: true,
            canViewRevenue: true,
            canViewStats: true,
          })),
        },
        notifications: {
          create: {
            emailOnNewBooking: true,
            emailOnCancellation: true,
            emailWeeklyReport: true,
            emailMonthlyReport: true,
          },
        },
      },
      include: {
        properties: true,
      },
    });

    console.log(`✅ 成功創建業主: ${owner.name} (${owner.email})`);
    console.log(`   Supabase User ID: ${supabaseUserId}`);
    console.log(`   關聯物業: ${propertyIds.join(', ')}`);

    return NextResponse.json({
      success: true,
      data: {
        owner,
        credentials: {
          email,
          password, // ⚠️ 只在創建時返回一次，請妥善保管
        },
      },
      message: '業主創建成功，請妥善保管登入密碼',
    });
  } catch (error: any) {
    console.error('[Admin Owners POST] 錯誤:', error);
    
    // Prisma 唯一約束錯誤
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: '此 Email 已被使用' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

