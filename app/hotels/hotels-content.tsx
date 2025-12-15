"use client";

import { HotelPropertyCard } from "@/components/hotel-property-card";
import { useProperties } from "@/contexts/properties-context";

export function HotelsContent() {
  const { properties, isLoading, error, refetch } = useProperties();

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
            onClick={refetch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">目前沒有可顯示的飯店據點</p>
          <p className="text-sm text-muted-foreground">
            更多據點即將推出，敬請期待
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              目前我們管理了 {properties.length} 間優質飯店
            </p>
            <button
              onClick={refetch}
              className="text-sm text-primary hover:underline"
            >
              重新整理
            </button>
          </div>

          <div className="grid gap-6">
            {properties.map((property) => (
              <HotelPropertyCard 
                key={property.id} 
                property={property}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

