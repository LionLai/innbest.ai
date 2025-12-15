import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { syncBookingToBeds24 } from '@/lib/beds24-sync';
import { BookingStatus, PaymentStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('❌ Stripe Webhook: 缺少簽名');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // 驗證 Webhook 簽名
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Stripe Webhook 簽名驗證失敗:', err);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err}` },
      { status: 400 }
    );
  }

  console.log('📩 收到 Stripe Webhook 事件:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment Intent 成功:', paymentIntent.id);
        // 主要邏輯在 checkout.session.completed 中處理
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`⚠️  未處理的 Webhook 事件類型: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook 處理錯誤:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * 處理 Checkout Session 完成事件
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  
  if (!bookingId) {
    console.error('❌ Checkout Session 缺少 bookingId');
    return;
  }

  console.log('🎉 處理訂單付款成功:', bookingId);

  // 1. 檢查 Payment 是否已存在（冪等性保護）
  const existingPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: session.payment_intent as string },
  });

  let payment;
  if (existingPayment) {
    console.log('⚠️  Payment 已存在，跳過創建:', existingPayment.id);
    payment = existingPayment;
  } else {
    // 創建 Payment 記錄
    payment = await prisma.payment.create({
      data: {
        stripePaymentIntentId: session.payment_intent as string,
        stripeCheckoutId: session.id,
        amount: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'JPY',
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
        metadata: session.metadata || undefined,
      },
    });
    console.log('✅ Payment 記錄已創建:', payment.id);
  }

  // 2. 獲取並檢查 Booking 狀態
  const currentBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!currentBooking) {
    console.error('❌ 訂單不存在:', bookingId);
    return;
  }

  // 如果訂單已經是 CONFIRMED 或更後面的狀態，說明已經處理過了
  if (currentBooking.status === BookingStatus.CONFIRMED) {
    console.log('⚠️  訂單已確認，跳過處理:', bookingId);
    return;
  }

  if (currentBooking.status === BookingStatus.REFUNDED || 
      currentBooking.status === BookingStatus.BEDS24_FAILED) {
    console.log('⚠️  訂單已退款或失敗，跳過處理:', bookingId);
    return;
  }

  // 3. 更新訂單狀態並關聯 Payment（只在 PENDING 或 PAYMENT_PROCESSING 時更新）
  if (currentBooking.status === BookingStatus.PENDING || 
      currentBooking.status === BookingStatus.PAYMENT_PROCESSING) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.PAYMENT_COMPLETED,
        paymentId: payment.id,
        updatedAt: new Date(),
      },
    });
    console.log('✅ 訂單狀態已更新為 PAYMENT_COMPLETED');
  } else if (currentBooking.status === BookingStatus.PAYMENT_COMPLETED) {
    console.log('⚠️  訂單已是 PAYMENT_COMPLETED 狀態，繼續處理同步');
  }

  // 3. 同步訂單到 Beds24（等待完成以確保在 Vercel 函數終止前完成）
  console.log('🔄 開始同步訂單到 Beds24...');
  
  try {
    await syncBookingToBeds24(bookingId);
    console.log('✅ Beds24 同步成功:', bookingId);
  } catch (err) {
    console.error('❌ 同步 Beds24 失敗 (已自動退款):', err);
    // 注意：失敗處理（包括自動退款）已在 syncBookingToBeds24 中完成
  }

  console.log('✅ Webhook 處理完成:', bookingId);
}

/**
 * 處理付款失敗事件
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (!bookingId) {
    console.warn('⚠️  Payment Intent 缺少 bookingId');
    return;
  }

  console.log('❌ 訂單付款失敗:', bookingId);

  // 1. 創建失敗的 Payment 記錄
  const payment = await prisma.payment.create({
    data: {
      stripePaymentIntentId: paymentIntent.id,
      stripeCheckoutId: paymentIntent.metadata?.checkoutSessionId || null,
      amount: paymentIntent.amount || 0,
      currency: paymentIntent.currency?.toUpperCase() || 'JPY',
      status: PaymentStatus.FAILED,
      failureReason: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata || undefined,
    },
  });

  // 2. 更新訂單狀態為取消並關聯 Payment
  await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      status: BookingStatus.CANCELLED,
      paymentId: payment.id,
      failureReason: paymentIntent.last_payment_error?.message || '付款失敗',
      updatedAt: new Date(),
    },
  });

  console.log('✅ 付款失敗處理完成:', bookingId);
}

