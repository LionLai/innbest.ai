import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@/lib/generated/prisma';
import { stripe } from '@/lib/stripe';
import { getBeds24Headers } from '@/lib/beds24-client';
import { calculateRoomPrice } from '@/lib/calculate-price';

// 訂單創建請求驗證 Schema
const createBookingSchema = z.object({
  roomId: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  roomName: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestFirstName: z.string().min(1).max(50),
  guestLastName: z.string().max(50).optional(),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(10).max(20),
  numAdults: z.number().int().min(1).max(10),
  numChildren: z.number().int().min(0).max(10),
  specialRequests: z.string().max(500).optional(),
  totalAmount: z.number().positive().transform(val => Math.round(val)), // 接受浮點數並四捨五入
  currency: z.string(),
  priceBreakdown: z.record(z.number().transform(val => Math.round(val))), // 價格明細也四捨五入
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. 驗證請求數據
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: '請求參數無效', 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 2. 再次驗證價格（防止前端篡改）
    const headers = await getBeds24Headers();
    const priceResult = await calculateRoomPrice(
      {
        roomId: data.roomId,
        propertyId: data.propertyId,
        startDate: data.checkIn,
        endDate: data.checkOut,
      },
      headers
    );
    
    if (!priceResult.success || priceResult.data?.totalAmount !== data.totalAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: '價格驗證失敗，請重新計算價格',
        },
        { status: 400 }
      );
    }

    // 3. 計算住宿天數
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // 4. 創建本地訂單記錄（狀態：PENDING）
    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        roomName: data.roomName,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        totalAmount: data.totalAmount,
        currency: data.currency,
        guestName: `${data.guestFirstName} ${data.guestLastName || ''}`.trim(),
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        adults: data.numAdults,
        children: data.numChildren,
        specialRequests: data.specialRequests || null,
        status: BookingStatus.PENDING,
      },
    });

    // 5. 創建 Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: data.currency.toLowerCase(),
            product_data: {
              name: data.roomName,
              description: `${data.checkIn} - ${data.checkOut} (${nights} 晚)`,
              metadata: {
                bookingId: booking.id,
                roomId: data.roomId.toString(),
                propertyId: data.propertyId.toString(),
              },
            },
            unit_amount: data.totalAmount, // Stripe 使用最小單位（JPY 的話就是圓）
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/hotels?booking_cancelled=true`,
      customer_email: data.guestEmail,
      metadata: {
        bookingId: booking.id,
        roomId: data.roomId.toString(),
        propertyId: data.propertyId.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 分鐘後過期
    });

    // 6. 創建 Payment 記錄並關聯到 Booking
    const payment = await prisma.payment.create({
      data: {
        stripePaymentIntentId: checkoutSession.payment_intent as string || 'pending',
        stripeCheckoutId: checkoutSession.id,
        amount: data.totalAmount,
        currency: data.currency,
        status: 'PENDING',
      },
    });

    // 7. 更新 Booking 關聯 Payment
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentId: payment.id },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      checkoutUrl: checkoutSession.url,
    });

  } catch (err) {
    console.error('❌ 創建訂單錯誤:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: '系統錯誤，請稍後再試' 
      },
      { status: 500 }
    );
  }
}

