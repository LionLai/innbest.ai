import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少訂單 ID' },
        { status: 400 }
      );
    }

    // 獲取訂單資料
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: '找不到訂單' },
        { status: 404 }
      );
    }

    // 格式化返回數據
    const response = {
      id: booking.id,
      roomName: booking.roomName,
      checkIn: booking.checkIn.toISOString().split('T')[0],
      checkOut: booking.checkOut.toISOString().split('T')[0],
      nights: booking.nights,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      guestEmail: booking.guestEmail,
      status: booking.status,
      beds24BookingId: booking.beds24BookingId,
      createdAt: booking.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error('獲取訂單錯誤:', err);
    return NextResponse.json(
      { success: false, error: '系統錯誤' },
      { status: 500 }
    );
  }
}

