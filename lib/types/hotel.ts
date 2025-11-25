// 簡化的飯店資料型別 - 只包含前端需要的欄位
export interface HotelProperty {
  id: number;
  name: string;
  propertyType?: string;
  city?: string;
  country?: string;
  address?: string;
  currency?: string;
  roomTypes: RoomType[];
}

// 簡化的房型資料型別 - 只包含前端需要的欄位
export interface RoomType {
  id: number;
  name: string;
  roomType?: string;
  maxPeople?: number;
  maxAdult?: number | null;
  maxChildren?: number | null;
  minPrice?: number;
  qty?: number;
}

// 空房查詢參數
export interface AvailabilitySearchParams {
  propertyId?: number;
  roomId?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

// 簡化的空房資料型別
export interface RoomAvailability {
  roomId: number;
  propertyId: number;
  name: string;
  availability: Record<string, boolean>; // { "2025-01-01": true, ... }
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

