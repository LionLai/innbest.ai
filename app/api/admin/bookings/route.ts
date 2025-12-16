import { NextResponse } from 'next/server';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * 獲取 Beds24 訂房列表並與本地資料對應
 * 支援分頁和篩選
 */
export async function GET(request: Request) {
  try {
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
    const beds24Bookings = data?.data || [];
    const total = data?.count || beds24Bookings.length;
    const totalPages = Math.ceil(total / pageSize);

    console.log(`✅ 成功獲取 ${beds24Bookings.length} 筆 Beds24 訂房`);

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

    console.log(`✅ 返回 ${filteredBookings.length} 筆訂房（${enrichedBookings.filter((b: any) => b._local.source === 'website').length} 筆網站訂房，${enrichedBookings.filter((b: any) => b._local.source === 'external').length} 筆外部訂房）`);

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
          website: enrichedBookings.filter((b: any) => b.source === 'website').length,
          external: enrichedBookings.filter((b: any) => b.source === 'external').length,
        },
      },
    });
  } catch (err) {
    console.error('❌ 伺服器錯誤:', err);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器內部錯誤',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

