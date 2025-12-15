import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';

export async function POST(req: Request) {
  try {
    // 從 session cookie 獲取認證 headers
    const headers = await getBeds24Headers();
    
    const body = await req.json();
    const { 
      paymentIntentId, 
      roomId, 
      startDate, 
      endDate, 
      guestName, 
      email, 
      phone,
      adults,
      children
    } = body;

    if (!paymentIntentId || !roomId || !startDate || !endDate || !guestName) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 1. 驗證 Stripe 付款狀態
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: '付款尚未完成' },
        { status: 400 }
      );
    }

    // 2. 建立 Beds24 訂單
    // 拆分姓名 (如果只有一個欄位)
    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '.'; // Beds24 可能需要 lastName

    const bookingData = [{
      roomId: Number(roomId),
      arrival: startDate,
      departure: endDate,
      status: 'confirmed' as const, // 直接確認
      firstName,
      lastName,
      email,
      mobile: phone,
      numAdult: Number(adults),
      numChild: Number(children),
      // 將 Stripe ID 記錄在 custom1 欄位，方便對帳
      custom1: paymentIntentId,
      // 記錄付款金額 (這只是記錄，不會觸發 Beds24 收款)
      price: paymentIntent.amount / 100, // 轉回主要單位 (假設 JPY 無小數，這裡可能需要根據幣別調整)
      apiMessage: 'Created via Innbest.ai Website',
    }];

    // 呼叫 Beds24 API 創建訂單（SDK 0.2.0 無狀態設計）
    const { data: bookingResult, error: bookingError } = await beds24Client.POST('/bookings', {
      headers,  // 每次請求傳入 token
      body: bookingData,
    });

    if (bookingError) {
      console.error('Beds24 Booking API Error:', bookingError);
      
      // 嚴重錯誤：付款成功但訂單建立失敗
      // 這裡應該觸發退款流程或發送警報給管理員
      // 暫時先回傳錯誤，讓前端顯示聯繫客服
      return NextResponse.json(
        { 
          error: '訂單建立失敗，請聯繫客服。您的付款已成功，我們會協助處理。',
          paymentIntentId 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: (bookingResult?.[0] as any)?.id, // 轉型為 any 以存取 id，因為 SDK 定義可能不完整
      message: '訂房成功'
    });

  } catch (err) {
    console.error('Create Booking Error:', err);
    return NextResponse.json(
      { error: '系統錯誤' },
      { status: 500 }
    );
  }
}

