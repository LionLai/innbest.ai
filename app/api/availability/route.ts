import { NextResponse } from 'next/server';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';
import type { RoomAvailability, ApiResponse } from '@/lib/types/hotel';

export const dynamic = 'force-dynamic'; // 不快取，始終獲取最新資料

export async function GET(request: Request) {
  try {
    // 從 session cookie 獲取認證 headers
    const headers = await getBeds24Headers();
    
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

    // 同時呼叫兩個 API：空房查詢 + 價格查詢
    const [availabilityResult, priceResult] = await Promise.all([
      // 1. 獲取空房資料
      beds24Client.GET('/inventory/rooms/availability', {
        headers,
        params: { query: queryParams },
      }),
      // 2. 獲取價格資料
      beds24Client.GET('/inventory/rooms/calendar', {
        headers,
        params: {
          query: {
            ...queryParams,
            includeLinkedPrices: true,        // 包含價格
            includeNumAvail: true,      // 包含可用數量
            includeMinStay: true,       // 包含最少入住天數
            includeMaxStay: true,       // 包含最多入住天數
          },
        },
      }),
    ]);

    // 檢查空房查詢是否成功
    if (availabilityResult.error) {
      console.error('Beds24 空房 API 錯誤:', availabilityResult.error);
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '無法取得空房資料',
        },
        { status: availabilityResult.response.status }
      );
    }

    // 檢查價格查詢是否成功（價格是可選的，所以只 log 錯誤，不中斷）
    if (priceResult.error) {
      console.warn('⚠️  Beds24 價格 API 錯誤（繼續處理空房數據）:', priceResult.error);
    }

    // 建立價格映射表 { roomId: { "2025-01-01": 1500, ... } }
    const priceMap = new Map<number, { prices: Record<string, number>; currency?: string }>();
    
    if (priceResult.data?.data) {
      for (const item of priceResult.data.data) {
        if (item.roomId && item.calendar) {
          const prices: Record<string, number> = {};
          
          // calendar API 返回的是日期範圍 (from/to)，需要展開成每一天
          for (const calendarEntry of item.calendar) {
            if (calendarEntry.from && calendarEntry.to && calendarEntry.price1) {
              const fromDate = new Date(calendarEntry.from);
              const toDate = new Date(calendarEntry.to);
              
              // 展開日期範圍內的每一天
              for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
                // 四捨五入到整數（日元無小數）
                prices[dateStr] = Math.round(calendarEntry.price1);
              }
            }
          }
          
          priceMap.set(item.roomId, { 
            prices,
            // currency 需要從 propertyId 對應的 property 中獲取，這裡先不設定
            currency: undefined
          });
        }
      }
    }

    // 整合空房和價格資料
    const availability: RoomAvailability[] = (availabilityResult.data?.data || []).map((item) => {
      const roomPriceData = priceMap.get(item.roomId!);
      return {
        roomId: item.roomId!,
        propertyId: item.propertyId!,
        name: item.name || '未命名房型',
        availability: item.availability || {},
        prices: roomPriceData?.prices,
        currency: roomPriceData?.currency,
      };
    });

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

