import { NextResponse } from 'next/server';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/owner/stats?period=month
 * 取得業主的統計數據
 * 查詢參數：period=week|month|year
 */
export async function GET(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // 從 middleware headers 獲取業主的物業 IDs
    const propertyIdsHeader = request.headers.get('x-property-ids');
    
    let propertyIds: number[] = [];
    if (propertyIdsHeader) {
      try {
        propertyIds = JSON.parse(propertyIdsHeader);
      } catch (error) {
        console.error('[Owner Stats] 解析 property IDs 失敗:', error);
      }
    }

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalBookings: 0,
            websiteBookings: 0,
            externalBookings: 0,
            totalRevenue: 0,
            activeRooms: 0,
            totalProperties: 0,
            occupancyRate: 0,
            growth: {
              bookings: '+0%',
              revenue: '+0%',
            },
          },
        },
      });
    }

    // 從 session 獲取認證 headers
    const headers = await getBeds24Headers();

    // 計算日期範圍
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
    const prevEndDateStr = prevEndDate.toISOString().split('T')[0];

    // 1. 獲取 Beds24 訂房數據（當前期間）- 使用訂單建立時間
    const beds24Result = await beds24Client.GET('/bookings', {
      headers,
      params: {
        query: {
          propertyId: propertyIds,
          bookingTimeFrom: startDateStr,
          pageSize: 1000,
        },
      },
    });

    // 2. 獲取上一期間的數據（用於計算增長率）- 使用訂單建立時間
    const prevBeds24Result = await beds24Client.GET('/bookings', {
      headers,
      params: {
        query: {
          propertyId: propertyIds,
          bookingTimeFrom: prevStartDateStr,
          bookingTimeTo: prevEndDateStr,
          pageSize: 1000,
        },
      },
    });

    const bookings = beds24Result.data?.data || [];
    const prevBookings = prevBeds24Result.data?.data || [];

    // 3. 獲取本站訂房數據（用於區分網站/外部訂房）
    const localBookings = await prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        createdAt: { gte: startDate },
        status: { in: ['CONFIRMED', 'PAYMENT_COMPLETED'] },
      },
      include: {
        payment: true,
      },
    });

    // 4. 計算統計數據
    const totalBookings = bookings.length;
    const prevTotalBookings = prevBookings.length;

    // 網站訂房：有對應 local booking 記錄的
    const websiteBookings = bookings.filter((b: any) =>
      localBookings.some((lb) => lb.beds24BookingId === b.id)
    ).length;

    const externalBookings = totalBookings - websiteBookings;

    // 計算總收入
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
    const prevTotalRevenue = prevBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    // 5. 計算活躍房源（有訂單的唯一房間數）
    const uniqueRoomIds = new Set(bookings.map((b: any) => b.roomId).filter((id: any) => id != null));
    const activeRooms = uniqueRoomIds.size;

    // 6. 獲取物業數量
    const uniquePropertyIds = new Set(bookings.map((b: any) => b.propertyId).filter((id: any) => id != null));
    const totalProperties = uniquePropertyIds.size;

    // 7. 計算入住率（簡化版：已訂天數 / 總可用天數）- 計算所有訂單
    const daysInPeriod = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalRoomNights = activeRooms * daysInPeriod;
    const bookedNights = bookings.reduce((sum: number, b: any) => {
      if (b.arrival && b.departure) {
        const checkIn = new Date(b.arrival);
        const checkOut = new Date(b.departure);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }
      return sum;
    }, 0);

    const occupancyRate =
      totalRoomNights > 0 ? (bookedNights / totalRoomNights) * 100 : 0;

    // 8. 計算增長率（保留兩位小數）
    const bookingsGrowth =
      prevTotalBookings > 0
        ? ((totalBookings - prevTotalBookings) / prevTotalBookings) * 100
        : 0;

    const revenueGrowth =
      prevTotalRevenue > 0
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          websiteBookings,
          externalBookings,
          totalRevenue: Math.round(totalRevenue),
          activeRooms,
          totalProperties,
          occupancyRate: Math.round(occupancyRate * 100) / 100, // 保留兩位小數
          growth: {
            bookings: bookingsGrowth >= 0 ? `+${bookingsGrowth.toFixed(2)}%` : `${bookingsGrowth.toFixed(2)}%`,
            revenue: revenueGrowth >= 0 ? `+${revenueGrowth.toFixed(2)}%` : `${revenueGrowth.toFixed(2)}%`,
          },
        },
      },
    });
  } catch (error) {
    console.error('[Owner Stats API] 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '系統錯誤',
      },
      { status: 500 }
    );
  }
}

