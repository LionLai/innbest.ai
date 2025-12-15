"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AvailabilitySearchForm } from "@/components/availability-search-form";
import type { HotelProperty } from "@/lib/types/hotel";

// 計算預設日期的輔助函數
function getDefaultDates() {
  const today = new Date();
  const checkIn = today.toISOString().split('T')[0]; // 今天
  
  const checkOutDate = new Date(today);
  checkOutDate.setDate(checkOutDate.getDate() + 30); // 30天後
  const checkOut = checkOutDate.toISOString().split('T')[0];
  
  return { checkIn, checkOut };
}

export function AvailabilityContent() {
  const [properties, setProperties] = useState<HotelProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  // 從 URL 參數獲取預選的 propertyId 和 roomId
  const preselectedPropertyId = searchParams.get('propertyId');
  const preselectedRoomId = searchParams.get('roomId');
  
  // 從 URL 參數獲取 checkin 和 checkout，如果沒有則使用預設值
  const defaultDates = getDefaultDates();
  const preselectedCheckIn = searchParams.get('checkin') || defaultDates.checkIn;
  const preselectedCheckOut = searchParams.get('checkout') || defaultDates.checkOut;

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/properties");
      const result = await response.json();

      if (result.success) {
        setProperties(result.data || []);
      } else {
        setError(result.error || "載入失敗");
      }
    } catch (err) {
      setError("網路錯誤，請稍後再試");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">載入飯店資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive text-lg font-semibold mb-2">載入失敗</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchProperties}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <AvailabilitySearchForm 
        properties={properties}
        defaultPropertyId={preselectedPropertyId ? parseInt(preselectedPropertyId) : undefined}
        defaultRoomId={preselectedRoomId ? parseInt(preselectedRoomId) : undefined}
        defaultCheckIn={preselectedCheckIn}
        defaultCheckOut={preselectedCheckOut}
      />
    </div>
  );
}

