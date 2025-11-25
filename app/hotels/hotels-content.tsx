"use client";

import { useEffect, useState } from "react";
import { HotelPropertyCard } from "@/components/hotel-property-card";
import { AvailabilitySearchForm } from "@/components/availability-search-form";
import type { HotelProperty } from "@/lib/types/hotel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function HotelsContent() {
  const [properties, setProperties] = useState<HotelProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [activeTab, setActiveTab] = useState<"properties" | "availability">("properties");

  return (
    <Tabs 
      defaultValue="properties" 
      className="w-full"
      onValueChange={(value) => setActiveTab(value as "properties" | "availability")}
    >
      <div className="flex flex-col items-center gap-4 mb-8">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto relative">
          <TabsTrigger 
            value="properties"
            className="relative z-10"
          >
            <span className="flex items-center gap-2">
              🏨 飯店據點
              {activeTab === "properties" && (
                <Badge variant="default" className="ml-1 text-xs px-1.5 py-0">
                  目前
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="availability"
            className="relative z-10"
          >
            <span className="flex items-center gap-2">
              🔍 查詢空房
              {activeTab === "availability" && (
                <Badge variant="default" className="ml-1 text-xs px-1.5 py-0">
                  目前
                </Badge>
              )}
            </span>
          </TabsTrigger>
        </TabsList>
        <p className="text-sm text-muted-foreground">
          目前查看：<span className="font-semibold text-foreground">
            {activeTab === "properties" ? "飯店據點" : "查詢空房"}
          </span>
        </p>
      </div>

      <TabsContent value="properties" className="space-y-6 mt-8">
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
                onClick={fetchProperties}
                className="text-sm text-primary hover:underline"
              >
                重新整理
              </button>
            </div>

            <div className="grid gap-6">
              {properties.map((property) => (
                <HotelPropertyCard key={property.id} property={property} />
              ))}
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="availability" className="mt-8">
        <AvailabilitySearchForm properties={properties} />
      </TabsContent>
    </Tabs>
  );
}

