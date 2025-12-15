import { prisma } from './prisma';
import { beds24Client, getBeds24Headers } from './beds24-client';
import { stripe } from './stripe';
import { sendEmail, getBookingConfirmationEmailHtml, sendAdminAlert } from './email';
import { BookingStatus, PaymentStatus, SyncAction, SyncStatus } from './generated/prisma';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // 重試延遲（毫秒）

/**
 * 同步訂單到 Beds24
 * 實現自動重試和退款機制
 */
export async function syncBookingToBeds24(bookingId: string): Promise<void> {
  console.log(`🔄 [Beds24 Sync] 開始處理訂單: ${bookingId}`);

  try {
    // 1. 獲取訂單資料
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new Error(`訂單不存在: ${bookingId}`);
    }

    // 2. 檢查是否已經同步過（冪等性保護）
    if (booking.beds24BookingId) {
      console.log(`✅ [Beds24 Sync] 訂單已同步過，Beds24 ID: ${booking.beds24BookingId}，跳過處理`);
      return;
    }

    // 3. 檢查訂單狀態
    if (booking.status === BookingStatus.CONFIRMED) {
      console.log(`✅ [Beds24 Sync] 訂單已確認，跳過處理`);
      return;
    }

    if (booking.status === BookingStatus.REFUNDED || 
        booking.status === BookingStatus.BEDS24_FAILED) {
      console.log(`⚠️  [Beds24 Sync] 訂單已退款或失敗，跳過處理`);
      return;
    }

    if (booking.status !== BookingStatus.PAYMENT_COMPLETED && 
        booking.status !== BookingStatus.BEDS24_CREATING) {
      throw new Error(`訂單狀態不正確: ${booking.status}`);
    }

    // 4. 更新狀態為「正在創建 Beds24 訂單」（如果還不是的話）
    if (booking.status !== BookingStatus.BEDS24_CREATING) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.BEDS24_CREATING },
      });
      console.log(`📝 [Beds24 Sync] 訂單狀態已更新為 BEDS24_CREATING`);
    } else {
      console.log(`⚠️  [Beds24 Sync] 訂單已在創建中，繼續處理`);
    }

    // 5. 嘗試創建 Beds24 訂單（帶重試）
    const beds24BookingId = await createBeds24BookingWithRetry(booking);

    // 6. 更新訂單狀態為「Beds24 已確認」
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.CONFIRMED,
        beds24BookingId,
      },
    });

    // 7. 發送確認郵件給客戶
    await sendBookingConfirmationEmail(booking);

    console.log(`✅ [Beds24 Sync] 訂單同步成功: ${bookingId} -> Beds24 ID: ${beds24BookingId}`);
  } catch (error) {
    console.error(`❌ [Beds24 Sync] 訂單同步失敗: ${bookingId}`, error);
    
    // 處理失敗：自動退款
    await handleSyncFailure(bookingId, error);
  }
}

/**
 * 創建 Beds24 訂單（帶重試機制）
 */
async function createBeds24BookingWithRetry(booking: any, retryCount = 0): Promise<number> {
  try {
    const headers = await getBeds24Headers();
    
    // 拆分客人姓名
    const nameParts = booking.guestName.split(' ');
    const firstName = nameParts[0] || booking.guestName;
    const lastName = nameParts.slice(1).join(' ') || '.';
    
    // 準備 Beds24 訂單數據
    const bookingData = [{
      roomId: booking.roomId,
      arrival: booking.checkIn.toISOString().split('T')[0],
      departure: booking.checkOut.toISOString().split('T')[0],
      status: 'confirmed' as const,
      firstName,
      lastName,
      email: booking.guestEmail,
      mobile: booking.guestPhone,
      numAdult: booking.adults,
      numChild: booking.children,
      notes: booking.specialRequests || undefined,
      // 記錄本地訂單 ID 和 Stripe Payment ID
      custom1: booking.id,
      custom2: booking.payment?.stripePaymentIntentId,
      price: Number(booking.totalAmount), // 轉換 Decimal 為數字
      apiMessage: 'Created via Innbest.ai Website',
    }];

    // 記錄同步日誌
    const syncLog = await prisma.syncLog.create({
      data: {
        bookingId: booking.id,
        action: SyncAction.CREATE,
        status: SyncStatus.PENDING,
        beds24Response: bookingData as any,
        retryCount,
      },
    });

    // 調用 Beds24 API
    const { data: result, error } = await beds24Client.POST('/bookings', {
      headers,
      body: bookingData,
    });

    if (error || !result?.[0]) {
      throw new Error(`Beds24 API 錯誤: ${JSON.stringify(error)}`);
    }

    const beds24BookingId = (result[0] as any).id;

    if (!beds24BookingId) {
      throw new Error('Beds24 API 未返回訂單 ID');
    }

    // 更新同步日誌為成功
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        beds24Response: result as any,
      },
    });

    return beds24BookingId;
  } catch (error) {
    console.error(`❌ Beds24 創建訂單失敗 (第 ${retryCount + 1} 次嘗試):`, error);

    // 更新同步日誌
    await prisma.syncLog.updateMany({
      where: { 
        bookingId: booking.id,
        action: SyncAction.CREATE,
      },
      data: {
        status: SyncStatus.FAILED,
        errorMessage: String(error),
        retryCount,
      },
    });

    // 如果還有重試次數，則重試
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(`⏳ 等待 ${delay}ms 後重試...`);
      await sleep(delay);
      
      // 更新狀態為重試中
      await prisma.syncLog.updateMany({
        where: { 
          bookingId: booking.id,
          action: SyncAction.CREATE,
        },
        data: {
          status: SyncStatus.RETRYING,
        },
      });

      return createBeds24BookingWithRetry(booking, retryCount + 1);
    }

    // 所有重試都失敗
    throw error;
  }
}

/**
 * 處理同步失敗：自動退款
 */
async function handleSyncFailure(bookingId: string, error: any): Promise<void> {
  console.log(`🔄 [Beds24 Sync] 開始處理失敗訂單: ${bookingId}`);

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking || !booking.payment) {
      throw new Error('找不到訂單或付款記錄');
    }

    const payment = booking.payment;

    // 1. 執行 Stripe 退款
    console.log('💰 執行自動退款...');
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer', // 或 'fraudulent', 'duplicate'
      metadata: {
        bookingId,
        reason: 'Beds24 創建訂單失敗',
      },
    });

    // 2. 更新訂單狀態
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.BEDS24_FAILED,
      },
    });

    // 3. 更新付款狀態
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    // 4. 發送退款通知給客戶
    await sendEmail({
      to: booking.guestEmail,
      subject: '訂房失敗 - 退款通知',
      html: `
        <h1>訂房失敗通知</h1>
        <p>親愛的 ${booking.guestName}，</p>
        <p>很抱歉，您的訂房無法完成，原因是庫存系統暫時無法確認。</p>
        <p><strong>我們已為您全額退款。</strong></p>
        <ul>
          <li>訂單編號: ${bookingId}</li>
          <li>房型: ${booking.roomName}</li>
          <li>日期: ${booking.checkIn.toISOString().split('T')[0]} - ${booking.checkOut.toISOString().split('T')[0]}</li>
          <li>退款金額: ¥${Number(booking.totalAmount).toLocaleString()}</li>
        </ul>
        <p>退款將在 5-10 個工作天內退回您的付款方式。</p>
        <p>如有任何疑問，請聯繫我們的客服。</p>
        <p>Innbest.ai 團隊</p>
      `,
    });

    // 5. 發送警報給管理員
    await sendAdminAlert({
      subject: `Beds24 同步失敗 - 已自動退款`,
      message: `訂單 ${bookingId} 的 Beds24 同步失敗，已執行自動退款。`,
      details: {
        bookingId,
        error: String(error),
        refundId: refund.id,
        amount: booking.totalAmount,
        currency: booking.currency,
      },
      level: 'HIGH',
    });

    console.log(`✅ [Beds24 Sync] 失敗處理完成，已退款: ${bookingId}`);
  } catch (refundError) {
    console.error(`❌ [Beds24 Sync] 退款失敗:`, refundError);

    // 極端情況：退款也失敗了，發送緊急警報
    await sendAdminAlert({
      subject: `🚨 緊急：訂單退款失敗`,
      message: `訂單 ${bookingId} 的 Beds24 同步失敗，且自動退款也失敗！請立即處理！`,
      details: {
        bookingId,
        syncError: String(error),
        refundError: String(refundError),
      },
      level: 'CRITICAL',
    });
  }
}

/**
 * 發送訂房確認郵件
 */
async function sendBookingConfirmationEmail(booking: any): Promise<void> {
  try {
    const html = getBookingConfirmationEmailHtml({
      customerName: booking.guestName,
      bookingId: booking.id,
      roomName: booking.roomName,
      checkInDate: booking.checkIn.toISOString().split('T')[0],
      checkOutDate: booking.checkOut.toISOString().split('T')[0],
      totalAmount: Number(booking.totalAmount).toLocaleString(),
      currency: booking.currency,
      propertyId: booking.propertyId,
      roomId: booking.roomId,
    });

    await sendEmail({
      to: booking.guestEmail,
      subject: `訂房確認 - ${booking.roomName}`,
      html,
    });

    console.log(`✅ 確認郵件已發送: ${booking.guestEmail}`);
  } catch (err) {
    console.error('❌ 發送確認郵件失敗:', err);
    // 不中斷流程，只記錄錯誤
  }
}

/**
 * 延遲函數
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

