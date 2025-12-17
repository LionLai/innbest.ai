import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/owner/session
 * 取得當前業主的 session 資訊和關聯物業
 * 
 * ✅ Middleware 已完成 JWT 驗證
 */
export async function GET(request: Request) {
  try {
    // 從 middleware 傳遞的 headers 獲取用戶信息
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId || !userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: '未登入或登入已過期',
        },
        { status: 401 }
      );
    }

    // 從 Prisma 獲取業主完整資料
    const owner = await prisma.owner.findUnique({
      where: { supabaseUserId: userId },
      include: {
        properties: {
          select: {
            propertyId: true,
            canViewBookings: true,
            canViewRevenue: true,
            canViewStats: true,
          },
        },
      },
    });

    if (!owner || !owner.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: '找不到對應的業主資料或帳號未啟用',
        },
        { status: 403 }
      );
    }

    // 從 Beds24 獲取物業名稱
    const propertyNames: Record<number, string> = {};
    
    try {
      const headers = await getBeds24Headers();
      const { data: propertiesData } = await beds24Client.GET('/properties', {
        headers,
      });

      if (propertiesData?.data) {
        propertiesData.data.forEach((property) => {
          if (property.id && property.name) {
            propertyNames[property.id] = property.name;
          }
        });
      }
    } catch (error) {
      console.warn('[Owner Session] 無法獲取物業名稱:', error);
      // 即使失敗也繼續，只是不會有物業名稱
    }

    // 返回業主資訊（包含物業名稱）
    return NextResponse.json({
      success: true,
      data: {
        owner: {
          id: owner.id,
          email: owner.email,
          name: owner.name,
          nameEn: owner.nameEn,
          phone: owner.phone,
          lastLoginAt: owner.lastLoginAt,
          properties: owner.properties.map((p) => ({
            propertyId: p.propertyId,
            propertyName: propertyNames[p.propertyId] || `Property ${p.propertyId}`,
            canViewBookings: p.canViewBookings,
            canViewRevenue: p.canViewRevenue,
            canViewStats: p.canViewStats,
          })),
        },
      },
    });
  } catch (error) {
    console.error('[Owner Session API] 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '系統錯誤',
      },
      { status: 500 }
    );
  }
}
