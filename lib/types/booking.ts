// 訂房相關類型定義

/**
 * 價格計算請求
 */
export interface CalculatePriceRequest {
  roomId: number;
  propertyId: number;
  checkIn: string;    // YYYY-MM-DD
  checkOut: string;   // YYYY-MM-DD
  adults: number;
  children: number;
}

/**
 * 雜項費用項目
 */
export interface RoomFeeItem {
  id: string;
  feeName: string;
  feeNameEn?: string | null;
  amount: number;
  currency: string;
}

/**
 * 價格計算響應（包含雜項費用）
 */
export interface CalculatePriceResponse {
  success: true;
  data: {
    propertyId: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    
    // 基本房價
    basePrice: number;
    breakdown: Record<string, number>;  // { "2025-01-15": 12000, ... }
    
    // 雜項費用
    fees: RoomFeeItem[];
    feesTotal: number;
    
    // 總價
    totalAmount: number;
    currency: string;
    
    // 向後兼容（舊代碼可能使用）
    priceBreakdown?: Record<string, number>;
  };
}

/**
 * API 錯誤響應
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  unavailableDates?: string[];
  missingPriceDates?: string[];
}

/**
 * 價格明細項目（用於顯示）
 */
export interface PriceBreakdownItem {
  date: string;
  price: number;
  dayOfWeek: string;  // 週一、週二等
}

