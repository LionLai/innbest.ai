import { prisma } from './prisma';
import { calculateRoomPrice } from './calculate-price';

export interface RoomFeeItem {
  id: string;
  feeName: string;
  feeNameEn?: string | null;
  amount: number;
  currency: string;
}

export interface PriceWithFeesResult {
  propertyId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  
  // 基本房價
  basePrice: number;
  breakdown: Record<string, number>;
  
  // 雜項費用
  fees: RoomFeeItem[];
  feesTotal: number;
  
  // 總價
  totalAmount: number;
  currency: string;
}

/**
 * 計算房間總價（基本房價 + 雜項費用）
 */
export async function calculateTotalPrice(params: {
  propertyId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}): Promise<PriceWithFeesResult> {
  // 1. 計算基本房價（從 Beds24）
  const basePriceResult = await calculateRoomPrice(params);
  
  // 檢查基本房價計算是否成功
  if (!basePriceResult.success || !basePriceResult.data) {
    throw new Error(basePriceResult.error || '無法計算基本房價');
  }
  
  const basePrice = basePriceResult.data;
  
  // 2. 獲取房間雜項費用
  const roomFees = await prisma.roomFee.findMany({
    where: {
      propertyId: params.propertyId,
      roomId: params.roomId,
      isActive: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });
  
  // 3. 計算雜項費用總額
  const feesTotal = roomFees.reduce(
    (sum, fee) => sum + Number(fee.amount),
    0
  );
  
  // 4. 轉換費用格式
  const fees: RoomFeeItem[] = roomFees.map(fee => ({
    id: fee.id,
    feeName: fee.feeName,
    feeNameEn: fee.feeNameEn,
    amount: Number(fee.amount),
    currency: fee.currency,
  }));
  
  // 5. 返回完整價格明細
  return {
    propertyId: params.propertyId,
    roomId: params.roomId,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights: basePrice.nights,
    
    basePrice: basePrice.totalAmount,
    breakdown: basePrice.priceBreakdown,
    
    fees,
    feesTotal,
    
    totalAmount: basePrice.totalAmount + feesTotal,
    currency: basePrice.currency,
  };
}

