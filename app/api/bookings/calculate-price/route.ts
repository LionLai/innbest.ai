import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getBeds24Headers } from '@/lib/beds24-client';
import { calculateRoomPrice } from '@/lib/calculate-price';

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
    
    // 2. 額外驗證日期邏輯（業務規則）
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    
    // 4. 調用共享的價格計算函數
    const result = await calculateRoomPrice(
      { roomId, propertyId, startDate, endDate },
      headers
    );
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          unavailableDates: result.unavailableDates,
        },
        { status: result.unavailableDates ? 409 : 400 }
      );
    }
    
    // 5. 返回成功結果
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('❌ 價格計算 API 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '系統錯誤',
      },
      { status: 500 }
    );
  }
}
