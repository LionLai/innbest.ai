import { Resend } from 'resend';
import type { Booking } from './generated/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@innbest.ai';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@innbest.ai';

/**
 * 通用的發送郵件函數
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    await resend.emails.send({
      from: options.from || FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log('✅ 郵件已發送至:', options.to);
  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    throw error;
  }
}

/**
 * 生成訂房確認信的 HTML 內容
 */
export function getBookingConfirmationEmailHtml(data: {
  customerName: string;
  bookingId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  currency: string;
  propertyId: number;
  roomId: number;
}) {
  return `
    <h1>訂房確認</h1>
    <p>親愛的 ${data.customerName}，</p>
    <p>您的訂房已確認！</p>
    
    <h2>訂房資訊</h2>
    <ul>
      <li>房型：${data.roomName}</li>
      <li>入住日期：${data.checkInDate}</li>
      <li>退房日期：${data.checkOutDate}</li>
      <li>總金額：¥${data.totalAmount} ${data.currency}</li>
    </ul>
    
    <p>訂單編號：${data.bookingId}</p>
    
    <p>期待您的光臨！</p>
    <p>innbest.ai 團隊</p>
  `;
}

/**
 * 發送管理員警報
 */
export async function sendAdminAlert(options: {
  subject: string;
  message: string;
  details?: any;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[${options.level}] ${options.subject}`,
      html: `
        <h1>管理員警報: ${options.subject}</h1>
        <p><strong>等級:</strong> ${options.level}</p>
        <p>${options.message}</p>
        ${options.details ? `<h2>詳情:</h2><pre>${JSON.stringify(options.details, null, 2)}</pre>` : ''}
        <p>請立即處理。</p>
        <p>innbest.ai 自動警報系統</p>
      `,
    });
    console.log('✅ 管理員警報已發送');
  } catch (error) {
    console.error('❌ 發送管理員警報失敗:', error);
  }
}

/**
 * 發送訂房確認信
 */
export async function sendBookingConfirmation(booking: Booking) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guestEmail,
      subject: `訂房確認 - ${booking.roomName}`,
      html: `
        <h1>訂房確認</h1>
        <p>親愛的 ${booking.guestName}，</p>
        <p>您的訂房已確認！</p>
        
        <h2>訂房資訊</h2>
        <ul>
          <li>房型：${booking.roomName}</li>
          <li>入住日期：${booking.checkIn.toISOString().split('T')[0]}</li>
          <li>退房日期：${booking.checkOut.toISOString().split('T')[0]}</li>
          <li>住宿天數：${booking.nights} 晚</li>
          <li>入住人數：${booking.adults} 位成人${booking.children > 0 ? `, ${booking.children} 位兒童` : ''}</li>
          <li>總金額：¥${booking.totalAmount.toLocaleString()} ${booking.currency}</li>
        </ul>
        
        ${booking.specialRequests ? `<p><strong>特殊需求：</strong> ${booking.specialRequests}</p>` : ''}
        
        <p>訂單編號：${booking.id}</p>
        ${booking.beds24BookingId ? `<p>Beds24 訂單號：${booking.beds24BookingId}</p>` : ''}
        
        <p>期待您的光臨！</p>
        <p>innbest.ai 團隊</p>
      `,
    });
    
    console.log('✅ 確認信已發送至:', booking.guestEmail);
  } catch (error) {
    console.error('❌ 發送確認信失敗:', error);
    throw error;
  }
}

/**
 * 發送退款通知信
 */
export async function sendRefundNotification(
  booking: Booking,
  refundAmount: number,
  reason: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guestEmail,
      subject: `訂房退款通知 - ${booking.roomName}`,
      html: `
        <h1>訂房退款通知</h1>
        <p>親愛的 ${booking.guestName}，</p>
        <p>很抱歉，您的訂房無法完成，我們已為您處理全額退款。</p>
        
        <h2>退款資訊</h2>
        <ul>
          <li>退款金額：¥${refundAmount.toLocaleString()} ${booking.currency}</li>
          <li>預計到帳時間：3-5 個工作天</li>
          <li>原因：${reason}</li>
        </ul>
        
        <h2>原訂房資訊</h2>
        <ul>
          <li>房型：${booking.roomName}</li>
          <li>入住日期：${booking.checkIn.toISOString().split('T')[0]}</li>
          <li>退房日期：${booking.checkOut.toISOString().split('T')[0]}</li>
        </ul>
        
        <p>如有任何問題，請聯繫客服：${ADMIN_EMAIL}</p>
        <p>再次為造成的不便致歉。</p>
        <p>innbest.ai 團隊</p>
      `,
    });
    
    console.log('✅ 退款通知已發送至:', booking.guestEmail);
  } catch (error) {
    console.error('❌ 發送退款通知失敗:', error);
    throw error;
  }
}

/**
 * 發送道歉信（含優惠券）
 */
export async function sendApologyEmail(
  booking: Booking,
  options: {
    refundAmount: number;
    voucherCode?: string;
    voucherAmount?: number;
  }
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guestEmail,
      subject: `訂房歉意通知 - 特別補償`,
      html: `
        <h1>訂房歉意通知</h1>
        <p>親愛的 ${booking.guestName}，</p>
        <p>非常抱歉，由於房間在付款確認期間被其他客人訂走，我們無法完成您的訂房。</p>
        
        <h2>退款資訊</h2>
        <ul>
          <li>退款金額：¥${options.refundAmount.toLocaleString()} ${booking.currency}</li>
          <li>預計到帳時間：3-5 個工作天</li>
        </ul>
        
        ${options.voucherCode ? `
        <h2>特別補償</h2>
        <p>為表歉意，我們準備了以下補償：</p>
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0284c7; margin-top: 0;">優惠券</h3>
          <p style="font-size: 24px; font-weight: bold; color: #0369a1; margin: 10px 0;">
            ${options.voucherCode}
          </p>
          <p style="color: #666;">
            優惠金額：¥${options.voucherAmount?.toLocaleString()} JPY<br>
            有效期限：30 天
          </p>
        </div>
        ` : ''}
        
        <h2>原訂房資訊</h2>
        <ul>
          <li>房型：${booking.roomName}</li>
          <li>入住日期：${booking.checkIn.toISOString().split('T')[0]}</li>
          <li>退房日期：${booking.checkOut.toISOString().split('T')[0]}</li>
        </ul>
        
        <p>如有任何疑問或需要協助重新預訂，請隨時聯繫我們：${ADMIN_EMAIL}</p>
        <p>再次為造成的不便致上最深的歉意。</p>
        <p>innbest.ai 團隊</p>
      `,
    });
    
    console.log('✅ 道歉信已發送至:', booking.guestEmail);
  } catch (error) {
    console.error('❌ 發送道歉信失敗:', error);
    throw error;
  }
}

/**
 * 發送管理員警報
 */
export async function notifyAdmin(alert: {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bookingId?: string;
  paymentIntentId?: string;
  error?: string;
  action?: string;
}) {
  try {
    const severityEmoji = {
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🟠',
      CRITICAL: '🔴',
    };
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `${severityEmoji[alert.severity]} [${alert.severity}] ${alert.type}`,
      html: `
        <h1>${severityEmoji[alert.severity]} 系統警報</h1>
        
        <h2>警報詳情</h2>
        <ul>
          <li><strong>類型：</strong> ${alert.type}</li>
          <li><strong>嚴重性：</strong> ${alert.severity}</li>
          <li><strong>時間：</strong> ${new Date().toISOString()}</li>
        </ul>
        
        ${alert.bookingId ? `<p><strong>訂單 ID：</strong> ${alert.bookingId}</p>` : ''}
        ${alert.paymentIntentId ? `<p><strong>Payment Intent ID：</strong> ${alert.paymentIntentId}</p>` : ''}
        ${alert.error ? `<p><strong>錯誤訊息：</strong> <code>${alert.error}</code></p>` : ''}
        ${alert.action ? `<p><strong>建議動作：</strong> ${alert.action}</p>` : ''}
        
        <p style="margin-top: 30px; padding: 15px; background-color: #fee2e2; border-left: 4px solid #dc2626;">
          ${alert.severity === 'CRITICAL' ? '⚠️ <strong>需要立即處理</strong>' : '請儘快檢查'}
        </p>
      `,
    });
    
    console.log('🚨 管理員警報已發送:', alert.type);
  } catch (error) {
    console.error('❌ 發送管理員警報失敗:', error);
    // 不拋出錯誤，避免影響主流程
  }
}

