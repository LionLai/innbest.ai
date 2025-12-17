import { NextResponse } from 'next/server';
import { beds24Client, getBeds24Headers } from '@/lib/beds24-client';
import { prisma } from '@/lib/prisma';
import { verifyAuth, handleAuthError } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * 獲取管理後台統計數據
 * 支援時間範圍篩選
 */
export async function GET(request: Request) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, week, year
    
    console.log('📊 開始計算統計數據...');

    // 計算日期範圍
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
    const previousEndDateStr = startDate.toISOString().split('T')[0];

    // 從 session 獲取認證 headers
    const headers = await getBeds24Headers();

    // 1. 獲取當前期間的訂房數據
    console.log('🔍 獲取當前期間訂房數據...');
    const currentBookingsResult = await beds24Client.GET('/bookings', {
      headers,
      params: {
        query: {
          bookingTimeFrom: startDateStr,
          pageSize: 1000, // 獲取足夠多的數據用於統計
        },
      },
    });

    // 2. 獲取上一期間的訂房數據（用於計算增長率）
    console.log('🔍 獲取上一期間訂房數據...');
    const previousBookingsResult = await beds24Client.GET('/bookings', {
      headers,
      params: {
        query: {
          bookingTimeFrom: previousStartDateStr,
          bookingTimeTo: previousEndDateStr,
          pageSize: 1000,
        },
      },
    });

    if (currentBookingsResult.error || previousBookingsResult.error) {
      console.error('❌ Beds24 API 錯誤');
      return NextResponse.json(
        {
          success: false,
          error: '無法取得統計資料',
        },
        { status: 500 }
      );
    }

    const currentBookings = currentBookingsResult.data?.data || [];
    const previousBookings = previousBookingsResult.data?.data || [];

    console.log(`✅ 當前期間: ${currentBookings.length} 筆訂房`);
    console.log(`✅ 上一期間: ${previousBookings.length} 筆訂房`);

    // 3. 獲取本地訂房資料（用於區分網站/外部訂房）
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

    const localBookingIds = new Set(localBookings.map(lb => lb.beds24BookingId!));

    // 4. 計算統計數據
    
    // 4.1 總訂單數和網站/外部訂房
    const totalBookings = currentBookings.length;
    const websiteBookings = currentBookings.filter((b: any) => localBookingIds.has(b.id)).length;
    const externalBookings = totalBookings - websiteBookings;
    
    // 4.2 總收入（只計算已確認的訂單）
    const totalRevenue = currentBookings
      .filter((b: any) => b.status === 'confirmed')
      .reduce((sum: number, b: any) => sum + (b.price || 0), 0);
    
    const previousRevenue = previousBookings
      .filter((b: any) => b.status === 'confirmed')
      .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    // 4.3 活躍房源（有訂單的唯一房間數）
    const uniqueRoomIds = new Set(currentBookings.map((b: any) => b.roomId));
    const activeRooms = uniqueRoomIds.size;

    // 4.4 計算入住率（簡化版：已確認訂單的天數 / 總可用天數）
    // 這是一個估算，精確計算需要 availability API
    const confirmedBookings = currentBookings.filter((b: any) => b.status === 'confirmed');
    const totalNights = confirmedBookings.reduce((sum: number, b: any) => {
      if (b.arrival && b.departure) {
        const arrival = new Date(b.arrival);
        const departure = new Date(b.departure);
        const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }
      return sum;
    }, 0);
    
    // 假設每個房間在這段期間都可用（簡化計算）
    const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAvailableDays = activeRooms * periodDays;
    const occupancyRate = totalAvailableDays > 0 ? (totalNights / totalAvailableDays) * 100 : 0;

    // 4.5 計算增長率
    const bookingsGrowth = previousBookings.length > 0
      ? ((totalBookings - previousBookings.length) / previousBookings.length * 100)
      : 0;
    
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue * 100)
      : 0;

    // 4.6 獲取房產數量
    const uniquePropertyIds = new Set(currentBookings.map((b: any) => b.propertyId));
    const totalProperties = uniquePropertyIds.size;

    console.log('✅ 統計計算完成');

    return NextResponse.json({
      success: true,
      data: {
        period,
        stats: {
          // 主要指標
          totalBookings,
          websiteBookings,
          externalBookings,
          totalRevenue: Math.round(totalRevenue),
          activeRooms,
          occupancyRate: Math.round(occupancyRate * 10) / 10, // 保留一位小數
          
          // 增長率
          growth: {
            bookings: bookingsGrowth >= 0 ? `+${bookingsGrowth.toFixed(1)}%` : `${bookingsGrowth.toFixed(1)}%`,
            revenue: revenueGrowth >= 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`,
          },
          
          // 額外資訊
          totalProperties,
          confirmedBookings: confirmedBookings.length,
          cancelledBookings: currentBookings.filter((b: any) => b.status === 'cancelled').length,
          
          // 原始數據（供調試）
          debug: {
            currentPeriodBookings: currentBookings.length,
            previousPeriodBookings: previousBookings.length,
            currentRevenue: Math.round(totalRevenue),
            previousRevenue: Math.round(previousRevenue),
            totalNights,
            totalAvailableDays,
          },
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

