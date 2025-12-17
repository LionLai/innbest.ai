import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/room-fees
 * 獲取所有雜項費用列表（支援篩選）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 篩選參數
    const propertyId = searchParams.get('propertyId');
    const roomId = searchParams.get('roomId');
    const isActive = searchParams.get('isActive');
    
    // 構建查詢條件
    const where: any = {};
    
    if (propertyId) {
      where.propertyId = parseInt(propertyId);
    }
    
    if (roomId) {
      where.roomId = parseInt(roomId);
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    console.log('🔍 查詢雜項費用:', where);
    
    // 查詢費用
    const fees = await prisma.roomFee.findMany({
      where,
      orderBy: [
        { propertyId: 'asc' },
        { roomId: 'asc' },
        { displayOrder: 'asc' },
      ],
    });
    
    console.log(`✅ 找到 ${fees.length} 筆雜項費用`);
    
    return NextResponse.json({
      success: true,
      data: {
        fees,
        count: fees.length,
      },
    });
  } catch (err) {
    console.error('❌ 獲取雜項費用失敗:', err);
    return NextResponse.json(
      {
        success: false,
        error: '獲取雜項費用失敗',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/room-fees
 * 新增雜項費用
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      propertyId,
      roomId,
      feeName,
      feeNameEn,
      amount,
      currency = 'JPY',
      isActive = true,
      displayOrder = 0,
      description,
    } = body;
    
    // 驗證必填欄位
    if (!propertyId || !roomId || !feeName || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填欄位',
          details: '需要提供 propertyId, roomId, feeName, amount',
        },
        { status: 400 }
      );
    }
    
    console.log('➕ 創建雜項費用:', { propertyId, roomId, feeName, amount });
    
    // 檢查是否已存在相同名稱的費用
    const existing = await prisma.roomFee.findUnique({
      where: {
        propertyId_roomId_feeName: {
          propertyId: parseInt(propertyId),
          roomId: parseInt(roomId),
          feeName,
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: '該房間已存在同名費用',
          details: `費用名稱 "${feeName}" 已存在`,
        },
        { status: 400 }
      );
    }
    
    // 創建費用
    const fee = await prisma.roomFee.create({
      data: {
        propertyId: parseInt(propertyId),
        roomId: parseInt(roomId),
        feeName,
        feeNameEn: feeNameEn || null,
        amount: parseFloat(amount),
        currency,
        isActive,
        displayOrder: parseInt(displayOrder) || 0,
        description: description || null,
      },
    });
    
    console.log('✅ 雜項費用已創建:', fee.id);
    
    return NextResponse.json({
      success: true,
      data: {
        fee,
      },
    });
  } catch (err) {
    console.error('❌ 創建雜項費用失敗:', err);
    return NextResponse.json(
      {
        success: false,
        error: '創建雜項費用失敗',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

