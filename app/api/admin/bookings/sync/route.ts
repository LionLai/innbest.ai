import { NextResponse } from 'next/server';
import { syncBookingToBeds24 } from '@/lib/beds24-sync';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * 手動同步訂單到 Beds24
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少訂單 ID',
        },
        { status: 400 }
      );
    }

    console.log(`🔄 手動同步訂單: ${bookingId}`);

    // 檢查訂單是否存在
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: '訂單不存在',
        },
        { status: 404 }
      );
    }

    // 檢查是否已經同步成功
    if (booking.beds24BookingId && booking.status === 'CONFIRMED') {
      return NextResponse.json(
        {
          success: false,
          error: '訂單已同步成功，無需重複同步',
          beds24BookingId: booking.beds24BookingId,
        },
        { status: 400 }
      );
    }

    // 如果訂單是失敗狀態，需要先重置狀態
    if (booking.status === 'BEDS24_FAILED') {
      console.log(`🔄 訂單狀態為 BEDS24_FAILED，重置為 PAYMENT_COMPLETED 以便重試`);
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_COMPLETED',
          failureReason: null,
          updatedAt: new Date(),
        },
      });
    } 
    // 如果訂單狀態不允許同步（但允許失敗狀態，因為上面會重置）
    else if (!['PENDING', 'PAYMENT_COMPLETED', 'PAYMENT_PROCESSING'].includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `訂單狀態不允許同步: ${booking.status}`,
          currentStatus: booking.status,
        },
        { status: 400 }
      );
    }

    // 執行同步
    try {
      await syncBookingToBeds24(bookingId);
      
      console.log(`✅ 手動同步成功: ${bookingId}`);
      
      return NextResponse.json({
        success: true,
        message: '訂單同步成功',
        bookingId,
      });
    } catch (syncError) {
      console.error(`❌ 手動同步失敗: ${bookingId}`, syncError);
      
      return NextResponse.json(
        {
          success: false,
          error: '同步失敗',
          details: syncError instanceof Error ? syncError.message : String(syncError),
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('❌ 手動同步 API 錯誤:', err);
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

/**
 * 批量同步所有未同步訂單
 */
export async function PUT(request: Request) {
  try {
    console.log('🔄 批量同步所有未同步訂單...');

    // 獲取所有未同步的訂單（包括失敗的訂單）
    const unsyncedBookings = await prisma.booking.findMany({
      where: {
        OR: [
          // 付款完成但還沒同步的
          {
            status: 'PAYMENT_COMPLETED',
            beds24BookingId: null,
          },
          // 之前同步失敗的
          {
            status: 'BEDS24_FAILED',
          },
          // 正在創建但可能卡住的（超過 10 分鐘）
          {
            status: 'BEDS24_CREATING',
            updatedAt: {
              lt: new Date(Date.now() - 10 * 60 * 1000), // 10 分鐘前
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc', // 優先同步舊的訂單
      },
    });

    if (unsyncedBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有需要同步的訂單',
        results: [],
      });
    }

    console.log(`📋 找到 ${unsyncedBookings.length} 筆未同步訂單`);

    // 批量同步（依序執行，避免併發問題）
    const results = [];
    for (const booking of unsyncedBookings) {
      try {
        // 如果是失敗狀態，先重置
        if (booking.status === 'BEDS24_FAILED' || 
            (booking.status === 'BEDS24_CREATING' && 
             booking.updatedAt < new Date(Date.now() - 10 * 60 * 1000))) {
          console.log(`🔄 重置訂單狀態: ${booking.id} (${booking.status})`);
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'PAYMENT_COMPLETED',
              failureReason: null,
              updatedAt: new Date(),
            },
          });
        }

        await syncBookingToBeds24(booking.id);
        results.push({
          bookingId: booking.id,
          success: true,
          originalStatus: booking.status,
        });
        console.log(`✅ 批量同步成功: ${booking.id}`);
      } catch (error) {
        results.push({
          bookingId: booking.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          originalStatus: booking.status,
        });
        console.error(`❌ 批量同步失敗: ${booking.id}`, error);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ 批量同步完成: ${successCount} 成功, ${failCount} 失敗`);

    return NextResponse.json({
      success: true,
      message: `批量同步完成: ${successCount} 成功, ${failCount} 失敗`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (err) {
    console.error('❌ 批量同步 API 錯誤:', err);
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

