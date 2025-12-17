import { beds24Client, getBeds24Headers } from './beds24-client';

export interface CalculatePriceParams {
  roomId: number;
  propertyId: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;   // YYYY-MM-DD
  adults: number;
  children: number;
}

export interface CalculatePriceResult {
  success: boolean;
  data?: {
    roomId: number;
    propertyId: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    priceBreakdown: Record<string, number>;
    totalAmount: number;
    currency: string;
  };
  error?: string;
  unavailableDates?: string[];
}

/**
 * 計算房間價格的共享邏輯
 * 可以在 API route 和其他服務器端代碼中復用
 * @param params - 計算參數（checkIn, checkOut, roomId, propertyId, adults, children）
 */
export async function calculateRoomPrice(
  params: CalculatePriceParams
): Promise<CalculatePriceResult> {
  const { roomId, propertyId, checkIn, checkOut } = params;
  
  // 獲取 Beds24 認證 headers
  const headers = await getBeds24Headers();

  try {
    // 1. 驗證日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return {
        success: false,
        error: '日期格式錯誤',
      };
    }

    // 2. 驗證日期邏輯
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        error: '日期無效',
      };
    }

    if (end <= start) {
      return {
        success: false,
        error: '退房日期必須晚於入住日期',
      };
    }

    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (nights > 365) {
      return {
        success: false,
        error: '住宿天數不能超過 365 天',
      };
    }

    // 3. 同時調用空房和價格 API
    const [availabilityResult, priceResult] = await Promise.all([
      beds24Client.GET('/inventory/rooms/availability', {
        headers,
        params: {
          query: {
            roomId: [roomId],
            propertyId: [propertyId],
            startDate: checkIn,
            endDate: checkOut,
          },
        },
      }),
      beds24Client.GET('/inventory/rooms/calendar', {
        headers,
        params: {
          query: {
            roomId: [roomId],
            propertyId: [propertyId],
            startDate: checkIn,
            endDate: checkOut,
            includePrices: true,
            includeLinkedPrices: true,
          },
        },
      }),
    ]);
    
    // 4. 檢查空房 API 錯誤
    if (availabilityResult.error) {
      console.error('Beds24 空房 API 錯誤:', availabilityResult.error);
      return {
        success: false,
        error: '無法查詢空房狀態',
      };
    }
    
    // 5. 檢查價格 API 錯誤
    if (priceResult.error) {
      console.error('Beds24 價格 API 錯誤:', priceResult.error);
      return {
        success: false,
        error: '無法查詢價格資訊',
      };
    }
    
    // 6. 驗證是否有空房
    const roomData = availabilityResult.data?.data?.[0];
    if (!roomData) {
      return {
        success: false,
        error: '找不到指定的房間',
      };
    }
    
    // 檢查每一天是否都有空房
    const availability = roomData.availability || {};
    const unavailableDates: string[] = [];
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!availability[dateStr]) {
        unavailableDates.push(dateStr);
      }
    }
    
    if (unavailableDates.length > 0) {
      return {
        success: false,
        error: '選擇的日期中有部分日期無空房',
        unavailableDates,
      };
    }
    
    // 7. 解析價格數據
    const priceData = priceResult.data?.data?.[0];
    if (!priceData || !priceData.calendar) {
      return {
        success: false,
        error: '無法取得價格資訊',
      };
    }
    
    // 8. 建立價格明細
    const priceBreakdown: Record<string, number> = {};
    let totalAmount = 0;
    
    // 展開日期範圍內的價格
    for (const calendarEntry of priceData.calendar) {
      if (calendarEntry.from && calendarEntry.to && calendarEntry.price1) {
        const fromDate = new Date(calendarEntry.from);
        const toDate = new Date(calendarEntry.to);
        
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // 只計算在查詢範圍內的日期（不包含退房日）
          if (dateStr >= checkIn && dateStr < checkOut) {
            // 四捨五入到整數（日元無小數）
            const roundedPrice = Math.round(calendarEntry.price1);
            priceBreakdown[dateStr] = roundedPrice;
            totalAmount += roundedPrice;
          }
        }
      }
    }
    
    // 9. 驗證是否所有日期都有價格
    const missingPriceDates: string[] = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!(dateStr in priceBreakdown)) {
        missingPriceDates.push(dateStr);
      }
    }
    
    if (missingPriceDates.length > 0) {
      return {
        success: false,
        error: '部分日期無價格資訊',
        unavailableDates: missingPriceDates,
      };
    }

    // 10. 獲取貨幣（Beds24 Calendar API 不返回 currency，預設為 JPY）
    const currency = 'JPY';

    return {
      success: true,
      data: {
        roomId,
        propertyId,
        checkIn,
        checkOut,
        nights,
        priceBreakdown,
        totalAmount,
        currency,
      },
    };
  } catch (error) {
    console.error('價格計算錯誤:', error);
    return {
      success: false,
      error: '系統錯誤',
    };
  }
}

