// 訂房相關類型定義

/**
 * 價格計算請求
 */
export interface CalculatePriceRequest {
  roomId: number;
  propertyId: number;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

/**
 * 價格計算響應
 */
export interface CalculatePriceResponse {
  success: true;
  data: {
    roomId: number;
    propertyId: number;
    roomName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    priceBreakdown: Record<string, number>;  // { "2025-01-15": 12000, ... }
    totalAmount: number;
    currency: string;
    calculatedAt: string;
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

