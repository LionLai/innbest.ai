import { NextResponse } from 'next/server';
import { beds24Client } from '@/lib/beds24-client';
import type { HotelProperty, ApiResponse } from '@/lib/types/hotel';

export const dynamic = 'force-dynamic'; // 不快取，始終獲取最新資料

export async function GET() {
  try {
    // 呼叫 Beds24 API 獲取飯店資料
    const { data, error, response } = await beds24Client.GET('/properties', {
      params: {
        query: {
          includeAllRooms: true, // 包含所有房型
          includePictures: true, // 包含所有圖片
        },
      },
    });

    if (error) {
      console.error('Beds24 API 錯誤:', error);
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '無法取得飯店資料',
        },
        { status: response.status }
      );
    }

    // 只提取前端需要的資料欄位
    const properties: HotelProperty[] = (data?.data || []).map((property) => ({
      id: property.id!,
      name: property.name || '未命名飯店',
      address: property.address,
      propertyType: property.propertyType,
      city: property.city,
      country: property.country,
      currency: property.currency,
      roomTypes: (property.roomTypes || []).map((room) => ({
        id: room.id!,
        name: room.name || '未命名房型',
        roomType: room.roomType,
        maxPeople: room.maxPeople,
        maxAdult: room.maxAdult,
        maxChildren: room.maxChildren,
        minPrice: room.minPrice,
        qty: room.qty,
      })),
    }));

    return NextResponse.json<ApiResponse<HotelProperty[]>>({
      success: true,
      data: properties,
    });
  } catch (err) {
    console.error('伺服器錯誤:', err);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: '伺服器內部錯誤',
      },
      { status: 500 }
    );
  }
}

