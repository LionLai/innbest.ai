import { NextResponse } from 'next/server';
import { beds24Client } from '@/lib/beds24-client';
import type { RoomAvailability, ApiResponse } from '@/lib/types/hotel';

export const dynamic = 'force-dynamic'; // 不快取，始終獲取最新資料

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const roomId = searchParams.get('roomId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 驗證必要參數
    if (!startDate || !endDate) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '請提供開始日期和結束日期',
        },
        { status: 400 }
      );
    }

    // 驗證日期格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '日期格式錯誤，請使用 YYYY-MM-DD 格式',
        },
        { status: 400 }
      );
    }

    // 構建查詢參數
    const queryParams: {
      startDate: string;
      endDate: string;
      propertyId?: number[];
      roomId?: number[];
    } = {
      startDate,
      endDate,
    };

    if (propertyId) {
      queryParams.propertyId = [parseInt(propertyId, 10)];
    }

    if (roomId) {
      queryParams.roomId = [parseInt(roomId, 10)];
    }

    // 呼叫 Beds24 API 獲取空房資料
    const { data, error, response } = await beds24Client.GET(
      '/inventory/rooms/availability',
      {
        params: {
          query: queryParams,
        },
      }
    );

    if (error) {
      console.error('Beds24 API 錯誤:', error);
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '無法取得空房資料',
        },
        { status: response.status }
      );
    }

    // 只提取前端需要的資料欄位
    const availability: RoomAvailability[] = (data?.data || []).map((item) => ({
      roomId: item.roomId!,
      propertyId: item.propertyId!,
      name: item.name || '未命名房型',
      availability: item.availability || {},
    }));

    return NextResponse.json<ApiResponse<RoomAvailability[]>>({
      success: true,
      data: availability,
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

