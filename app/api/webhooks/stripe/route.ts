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

  // 1. 更新訂單狀態
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      status: BookingStatus.PAYMENT_COMPLETED,
      updatedAt: new Date(),
    },
  });

  // 2. 更新 Payment 記錄
  await prisma.payment.update({
    where: { 
      stripePaymentIntentId: session.payment_intent as string,
    },
    data: {
      status: PaymentStatus.SUCCEEDED,
      paidAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 3. 觸發後台任務：創建 Beds24 訂單
  // 這裡使用簡單的異步調用，未來可以改用 Queue (例如 Inngest, BullMQ)
  console.log('🔄 開始同步訂單到 Beds24...');
  
  // 不等待完成，避免 Webhook 超時
  syncBookingToBeds24(bookingId).catch((err) => {
    console.error('❌ 同步 Beds24 失敗 (將在後台重試):', err);
  });

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

  // 更新訂單狀態為失敗
  await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      status: BookingStatus.CANCELLED,
      updatedAt: new Date(),
    },
  });

  // 更新 Payment 記錄
  await prisma.payment.update({
    where: { 
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: PaymentStatus.FAILED,
      updatedAt: new Date(),
    },
  });
}

