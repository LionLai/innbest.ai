import { NextResponse } from "next/server";
import { beds24Client, getBeds24Headers } from "@/lib/beds24-client";

export const dynamic = 'force-dynamic';

/**
 * 獲取所有物業列表（用於下拉選單）
 * GET /api/admin/properties
 * 
 * ✅ Middleware 已完成 JWT 驗證（Admin 權限）
 */
export async function GET(request: Request) {
  try {
    // 從 session cookie 獲取認證 headers
    const headers = await getBeds24Headers();

    // 從 Beds24 獲取物業列表
    const { data, error, response } = await beds24Client.GET('/properties', {
      headers,
      params: {
        query: {
          includeAllRooms: false,
        },
      },
    });

    if (error) {
      console.error('[Admin Properties] Beds24 API 錯誤:', error);
      return NextResponse.json(
        {
          success: false,
          error: '無法獲取物業列表',
        },
        { status: response.status }
      );
    }

    // 格式化物業列表
    const formattedProperties = (data?.data || []).map((property: any) => ({
      id: property.id,
      name: property.name || `Property ${property.id}`,
      address: property.address || '',
      city: property.city || '',
    }));

    return NextResponse.json({
      success: true,
      data: formattedProperties,
    });
  } catch (error) {
    console.error('[Admin Properties] 獲取物業列表失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取物業列表失敗',
      },
      { status: 500 }
    );
  }
}

