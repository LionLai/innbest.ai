import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { beds24Client } from '@/lib/beds24-client';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomId, propertyId, startDate, endDate, guests } = body;

    if (!roomId || !startDate || !endDate) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 1. 向 Beds24 查詢每日價格
    // 注意：Beds24 的 calendar API 回傳的是每一天的設定
    // 我們需要查詢這段期間的價格並加總
    const { data: calendarData, error: calendarError } = await beds24Client.GET('/inventory/rooms/calendar', {
      params: {
        query: {
          roomId: [roomId],
          startDate,
          endDate,
          includePrices: true,
        },
      },
    });

    if (calendarError || !calendarData?.data?.[0]?.calendar) {
      console.error('Beds24 Calendar API Error:', calendarError);
      return NextResponse.json(
        { error: '無法取得價格資訊' },
        { status: 500 }
      );
    }

    // 2. 計算總金額
    // Beds24 回傳的 calendar 是一個陣列，包含日期範圍的設定
    // 例如：[{ from: '2025-01-01', to: '2025-01-05', price1: 1000 }]
    const calendarItems = calendarData.data[0].calendar as Array<{
      from: string;
      to: string;
      price1?: number;
    }>;

    if (!Array.isArray(calendarItems)) {
       return NextResponse.json(
        { error: '無效的價格資料格式' },
        { status: 500 }
      );
    }

    let totalPrice = 0;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const nights = differenceInDays(end, start);
    
    if (nights <= 0) {
      return NextResponse.json(
        { error: '無效的日期範圍' },
        { status: 400 }
      );
    }

    // 遍歷每一晚
    for (let i = 0; i < nights; i++) {
      const dateStr = format(addDays(start, i), 'yyyy-MM-dd');
      
      // 尋找包含此日期的價格設定
      const dayData = calendarItems.find(item => 
        item.from <= dateStr && item.to >= dateStr
      );

      // 檢查當天是否有價格
      // 注意：Beds24 API 使用 price1, price2 等
      const price = dayData?.price1; 
      
      if (typeof price !== 'number') {
        console.error(`Missing price for date ${dateStr}`);
        return NextResponse.json(
          { error: `無法取得 ${dateStr} 的價格` },
          { status: 400 }
        );
      }

      // 四捨五入到整數（日元無小數）
      totalPrice += Math.round(price);
    }

    // 3. 建立 Stripe PaymentIntent
    // Stripe 金額單位是「最小貨幣單位」（例如美金是分，日圓是圓）
    // 假設 Beds24 價格是主要單位（如 100 美元），需要轉換
    // 這裡需要知道貨幣類型，通常從 Beds24 property 資訊取得
    // 暫時假設是 TWD 或 JPY (無小數位) 或 USD (兩位小數)
    // 為了安全，我們這裡先假設是 JPY (因為是東京飯店)
    
    // 修正：我們應該先查詢 Property 的貨幣設定，這裡先從環境變數或固定設定取得
    const currency = 'jpy'; 
    const amount = Math.round(totalPrice); // JPY 沒有小數點

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        roomId,
        propertyId,
        startDate,
        endDate,
        guests: JSON.stringify(guests),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      totalPrice,
      currency,
    });

  } catch (err) {
    console.error('Create Payment Intent Error:', err);
    return NextResponse.json(
      { error: '建立付款失敗' },
      { status: 500 }
    );
  }
}

