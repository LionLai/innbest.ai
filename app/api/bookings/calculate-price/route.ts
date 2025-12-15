import { NextResponse } from 'next/server';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';
import { z } from 'zod';

// 輸入驗證 Schema
const calculatePriceSchema = z.object({
  roomId: z.number().positive('房間 ID 必須是正整數'),
  propertyId: z.number().positive('物業 ID 必須是正整數'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須是 YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須是 YYYY-MM-DD'),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. 解析並驗證請求
    const body = await request.json();
    const validation = calculatePriceSchema.safeParse(body);
    
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
    
    const { roomId, propertyId, startDate, endDate } = validation.data;
    
    // 2. 驗證日期邏輯
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: '退房日期必須晚於入住日期',
        },
        { status: 400 }
      );
    }
    
    if (start < today) {
      return NextResponse.json(
        {
          success: false,
          error: '入住日期不能早於今天',
        },
        { status: 400 }
      );
    }
    
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights > 90) {
      return NextResponse.json(
        {
          success: false,
          error: '最多只能預訂 90 晚',
        },
        { status: 400 }
      );
    }
    
    // 3. 從 session cookie 獲取認證 headers
    const headers = await getBeds24Headers();
    
    // 4. 並行獲取空房狀態和價格
    const [availabilityResult, priceResult] = await Promise.all([
      // 檢查空房狀態
      beds24Client.GET('/inventory/rooms/availability', {
        headers,
        params: {
          query: {
            roomId: [roomId],
            propertyId: [propertyId],
            startDate,
            endDate,
          },
        },
      }),
      // 獲取價格
      beds24Client.GET('/inventory/rooms/calendar', {
        headers,
        params: {
          query: {
            roomId: [roomId],
            propertyId: [propertyId],
            startDate,
            endDate,
            includePrices: true,
            includeLinkedPrices: true,
          },
        },
      }),
    ]);
    
    // 5. 檢查空房 API 錯誤
    if (availabilityResult.error) {
      console.error('Beds24 空房 API 錯誤:', availabilityResult.error);
      return NextResponse.json(
        {
          success: false,
          error: '無法查詢空房狀態',
        },
        { status: availabilityResult.response.status }
      );
    }
    
    // 6. 檢查價格 API 錯誤
    if (priceResult.error) {
      console.error('Beds24 價格 API 錯誤:', priceResult.error);
      return NextResponse.json(
        {
          success: false,
          error: '無法查詢價格資訊',
        },
        { status: priceResult.response.status }
      );
    }
    
    // 7. 驗證是否有空房
    const roomData = availabilityResult.data?.data?.[0];
    if (!roomData) {
      return NextResponse.json(
        {
          success: false,
          error: '找不到指定的房間',
        },
        { status: 404 }
      );
    }
    
    // 檢查每一天是否都有空房
    const availability = roomData.availability || {};
    const unavailableDates: string[] = [];
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!availability[dateStr]) {
        unavailableDates.push(dateStr);
      }
    }
    
    if (unavailableDates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '選擇的日期中有部分日期無空房',
          unavailableDates,
        },
        { status: 409 }
      );
    }
    
    // 8. 解析價格數據
    const priceData = priceResult.data?.data?.[0];
    if (!priceData || !priceData.calendar) {
      return NextResponse.json(
        {
          success: false,
          error: '無法取得價格資訊',
        },
        { status: 404 }
      );
    }
    
    // 9. 建立價格明細
    const priceBreakdown: Record<string, number> = {};
    let totalAmount = 0;
    
    // 展開日期範圍內的價格
    for (const calendarEntry of priceData.calendar) {
      if (calendarEntry.from && calendarEntry.to && calendarEntry.price1) {
        const fromDate = new Date(calendarEntry.from);
        const toDate = new Date(calendarEntry.to);
        
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // 只計算在查詢範圍內的日期（不包含退房日）
          if (dateStr >= startDate && dateStr < endDate) {
            priceBreakdown[dateStr] = calendarEntry.price1;
            totalAmount += calendarEntry.price1;
          }
        }
      }
    }
    
    // 10. 驗證是否所有日期都有價格
    const missingPriceDates: string[] = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!priceBreakdown[dateStr]) {
        missingPriceDates.push(dateStr);
      }
    }
    
    if (missingPriceDates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '部分日期缺少價格資訊',
          missingPriceDates,
        },
        { status: 422 }
      );
    }
    
    // 11. 返回成功結果
    return NextResponse.json({
      success: true,
      data: {
        roomId,
        propertyId,
        roomName: roomData.name || '未命名房型',
        checkIn: startDate,
        checkOut: endDate,
        nights,
        priceBreakdown,
        totalAmount,
        currency: 'JPY', // 可以從 priceData 獲取，但預設為 JPY
        calculatedAt: new Date().toISOString(),
      },
    });
    
  } catch (err) {
    console.error('計算價格錯誤:', err);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器內部錯誤',
      },
      { status: 500 }
    );
  }
}

