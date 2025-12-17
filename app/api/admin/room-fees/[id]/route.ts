import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, handleAuthError } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/room-fees/[id]
 * 更新雜項費用
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    
    const { id } = await params;
    const body = await request.json();
    
    console.log('📝 更新雜項費用:', id);
    
    // 檢查費用是否存在
    const existing = await prisma.roomFee.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: '費用不存在',
        },
        { status: 404 }
      );
    }
    
    // 準備更新資料
    const updateData: any = {};
    
    if (body.feeName !== undefined) updateData.feeName = body.feeName;
    if (body.feeNameEn !== undefined) updateData.feeNameEn = body.feeNameEn || null;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.displayOrder !== undefined) updateData.displayOrder = parseInt(body.displayOrder);
    if (body.description !== undefined) updateData.description = body.description || null;
    
    // 如果要更新費用名稱，檢查是否與其他費用衝突
    if (body.feeName && body.feeName !== existing.feeName) {
      const conflict = await prisma.roomFee.findUnique({
        where: {
          propertyId_roomId_feeName: {
            propertyId: existing.propertyId,
            roomId: existing.roomId,
            feeName: body.feeName,
          },
        },
      });
      
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: '該房間已存在同名費用',
          },
          { status: 400 }
        );
      }
    }
    
    // 更新費用
    const fee = await prisma.roomFee.update({
      where: { id },
      data: updateData,
    });
    
    console.log('✅ 雜項費用已更新:', fee.id);
    
    return NextResponse.json({
      success: true,
      data: {
        fee,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/room-fees/[id]
 * 刪除雜項費用
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Middleware 已完成 JWT 驗證
    
    const { id } = await params;
    
    console.log('🗑️  刪除雜項費用:', id);
    
    // 檢查費用是否存在
    const existing = await prisma.roomFee.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: '費用不存在',
        },
        { status: 404 }
      );
    }
    
    // 刪除費用
    await prisma.roomFee.delete({
      where: { id },
    });
    
    console.log('✅ 雜項費用已刪除:', id);
    
    return NextResponse.json({
      success: true,
      message: '費用已刪除',
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

