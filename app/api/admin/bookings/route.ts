import { NextResponse } from 'next/server';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';
import { prisma } from '@/lib/prisma';
import { verifyAuth, handleAuthError } from '@/lib/api-auth';
import { filterBookings, logFilterConfig } from '@/lib/filters/room-filter';

export const dynamic = 'force-dynamic';

/**
 * 獲取 Beds24 訂房列表並與本地資料對應
 * 支援分頁和篩選
 */
export async function GET(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    
    const { searchParams } = new URL(request.url);
    
    // 分頁參數
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // 篩選參數
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate');     // YYYY-MM-DD
    const status = searchParams.get('status');       // confirmed, cancelled, etc.
    const propertyId = searchParams.get('propertyId');
    const roomId = searchParams.get('roomId');
    const source = searchParams.get('source');       // 'all', 'website', 'external'

    // 從 session 獲取認證 headers
    const headers = await getBeds24Headers();

    // 構建查詢參數
    const queryParams: any = {
      page,
      pageSize,
    };

    // 添加可選篩選參數
    if (startDate) {
      queryParams.arrivalFrom = startDate;
    }
    if (endDate) {
      queryParams.arrivalTo = endDate;
    }
    if (status) {
      queryParams.status = status;
    }
    if (propertyId) {
      queryParams.propertyId = parseInt(propertyId);
    }
    if (roomId) {
      queryParams.roomId = parseInt(roomId);
    }

    console.log('🔍 查詢 Beds24 訂房列表:', queryParams);

    // 調用 Beds24 API
    const { data, error, response } = await beds24Client.GET('/bookings', {
      headers,
      params: {
        query: queryParams,
      },
    });

    if (error) {
      console.error('❌ Beds24 API 錯誤:', error);
      return NextResponse.json(
        {
          success: false,
          error: '無法取得訂房資料',
          details: error,
        },
        { status: response.status || 500 }
      );
    }

    // 處理返回數據
    logFilterConfig();
    
    const rawBookings = data?.data || [];
    console.log(`📦 從 Beds24 獲取 ${rawBookings.length} 筆訂房`);
    
    // 應用過濾器
    const beds24Bookings = filterBookings(rawBookings);
    
    const total = beds24Bookings.length; // 使用過濾後的數量
    const totalPages = Math.ceil(total / pageSize);

    console.log(`✅ 過濾後剩餘 ${beds24Bookings.length} 筆訂房`);

    // 獲取本地訂房資料用於對應
    console.log('🔍 查詢本地訂房資料...');
    const localBookings = await prisma.booking.findMany({
      where: {
        beds24BookingId: {
          not: null,
        },
      },
      include: {
        payment: true,
      },
    });

    console.log(`✅ 找到 ${localBookings.length} 筆本地訂房記錄`);

    // 創建對應映射表 (beds24BookingId -> localBooking)
    const bookingMap = new Map(
      localBookings.map(lb => [lb.beds24BookingId!, lb])
    );

    // 合併資料：以 Beds24 為主，附加本地資料
    const enrichedBookings = beds24Bookings.map((b24Booking: any) => {
      const localBooking = bookingMap.get(b24Booking.id);
      
      return {
        // Beds24 所有原始資料（保留完整欄位）
        ...b24Booking,
        
        // 附加本地資料（如果有對應）
        _local: localBooking ? {
          source: 'website',
          bookingId: localBooking.id,
          beds24BookingId: localBooking.beds24BookingId,
          propertyId: localBooking.propertyId,
          roomId: localBooking.roomId,
          roomName: localBooking.roomName,
          checkIn: localBooking.checkIn,
          checkOut: localBooking.checkOut,
          nights: localBooking.nights,
          guestName: localBooking.guestName,
          guestEmail: localBooking.guestEmail,
          guestPhone: localBooking.guestPhone,
          guestAddress: localBooking.guestAddress,
          adults: localBooking.adults,
          children: localBooking.children,
          specialRequests: localBooking.specialRequests,
          totalAmount: localBooking.totalAmount,
          currency: localBooking.currency,
          priceBreakdown: localBooking.priceBreakdown,
          status: localBooking.status,
          failureReason: localBooking.failureReason,
          paymentId: localBooking.paymentId,
          payment: localBooking.payment ? {
            id: localBooking.payment.id,
            stripePaymentIntentId: localBooking.payment.stripePaymentIntentId,
            stripeCheckoutId: localBooking.payment.stripeCheckoutId,
            amount: localBooking.payment.amount,
            currency: localBooking.payment.currency,
            status: localBooking.payment.status,
            paidAt: localBooking.payment.paidAt,
            failureReason: localBooking.payment.failureReason,
          } : null,
          createdAt: localBooking.createdAt,
          updatedAt: localBooking.updatedAt,
        } : {
          source: 'external',
        },
      };
    });

    // 如果指定了來源篩選
    let filteredBookings = enrichedBookings;
    if (source === 'website') {
      filteredBookings = enrichedBookings.filter((b: any) => b._local.source === 'website');
    } else if (source === 'external') {
      filteredBookings = enrichedBookings.filter((b: any) => b._local.source === 'external');
    }

    // 按入住時間排序（從早到晚）
    filteredBookings.sort((a: any, b: any) => {
      const dateA = new Date(a.arrival || 0).getTime();
      const dateB = new Date(b.arrival || 0).getTime();
      return dateA - dateB; // 升冪排列（最早的入住日期在前）
    });

    console.log(`✅ 返回 ${filteredBookings.length} 筆訂房（${enrichedBookings.filter((b: any) => b._local.source === 'website').length} 筆網站訂房，${enrichedBookings.filter((b: any) => b._local.source === 'external').length} 筆外部訂房）`);

    // ========================================
    // 兩階段檢測未同步的訂單
    // ========================================
    
    // 第一步：獲取所有本地的 PAYMENT_COMPLETED 訂單
    const localPaymentCompletedBookings = await prisma.booking.findMany({
      where: {
        status: 'PAYMENT_COMPLETED',
      },
      include: {
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`🔍 檢查 ${localPaymentCompletedBookings.length} 筆 PAYMENT_COMPLETED 訂單的同步狀態...`);

    // 第二步：建立 Beds24 訂單 ID 的 Set（用於快速查找）
    const beds24BookingIds = new Set(beds24Bookings.map((b: any) => b.id));
    
    // 第三步：檢測未同步的訂單（兩種情況）
    const unsyncedBookings = localPaymentCompletedBookings
      .map(booking => {
        // 情況 1：完全未同步（沒有 beds24BookingId）
        if (!booking.beds24BookingId) {
          return {
            ...booking,
            syncIssue: 'no_beds24_id' as const,
            syncIssueMessage: '完全未同步（無 Beds24 ID）',
          };
        }
        
        // 情況 2：有 beds24BookingId 但在 Beds24 API 中找不到
        if (!beds24BookingIds.has(booking.beds24BookingId)) {
          return {
            ...booking,
            syncIssue: 'beds24_not_found' as const,
            syncIssueMessage: `Beds24 中找不到此訂單（ID: ${booking.beds24BookingId}）`,
          };
        }
        
        // 正常同步
        return null;
      })
      .filter(Boolean); // 移除 null 值

    const noIdCount = unsyncedBookings.filter((b: any) => b.syncIssue === 'no_beds24_id').length;
    const notFoundCount = unsyncedBookings.filter((b: any) => b.syncIssue === 'beds24_not_found').length;

    console.log(`⚠️  發現 ${unsyncedBookings.length} 筆未同步訂單：`);
    console.log(`   - ${noIdCount} 筆完全未同步（無 Beds24 ID）`);
    console.log(`   - ${notFoundCount} 筆 ID 不一致（Beds24 中找不到）`);

    return NextResponse.json({
      success: true,
      data: {
        bookings: filteredBookings,
        pagination: {
          page,
          pageSize,
          total: source ? filteredBookings.length : total,
          totalPages: source ? Math.ceil(filteredBookings.length / pageSize) : totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats: {
          total: enrichedBookings.length,
          website: enrichedBookings.filter((b: any) => b._local.source === 'website').length,
          external: enrichedBookings.filter((b: any) => b._local.source === 'external').length,
        },
        // 未同步訂單資訊
        unsyncedBookings: unsyncedBookings.map((b: any) => ({
          id: b.id,
          roomName: b.roomName,
          guestName: b.guestName,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
          totalAmount: b.totalAmount,
          createdAt: b.createdAt,
          paymentId: b.paymentId,
          failureReason: b.failureReason,
          beds24BookingId: b.beds24BookingId,
          syncIssue: b.syncIssue,
          syncIssueMessage: b.syncIssueMessage,
        })),
        unsyncedStats: {
          total: unsyncedBookings.length,
          noIdCount,
          notFoundCount,
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

