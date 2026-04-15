"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingDialog } from "@/components/booking-dialog";
import { getPropertyPrimaryImage } from "@/lib/images-config";
import type { RoomAvailability, HotelProperty } from "@/lib/types/hotel";

interface AvailabilitySearchFormProps {
  properties: HotelProperty[];
  defaultPropertyId?: number;
  defaultRoomId?: number;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}

interface BestRoomResult {
  property: HotelProperty;
  room: RoomAvailability;
  totalPrice: number;
  nights: number;
  currency: string;
}

// 枚舉 checkIn 到 checkOut 之間的每一晚（不含 checkOut 當天）
function getNightDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// 若房間整段都可訂且每晚都有價格，回傳總價；否則回傳 null
function calcTotalPriceIfAvailable(
  room: RoomAvailability,
  nightDates: string[],
): number | null {
  let total = 0;
  for (const date of nightDates) {
    if (!room.availability[date]) return null;
    const price = room.prices?.[date];
    if (price == null) return null;
    total += price;
  }
  return total;
}

export function AvailabilitySearchForm({
  properties,
  defaultPropertyId,
  defaultRoomId,
  defaultCheckIn = "",
  defaultCheckOut = "",
}: AvailabilitySearchFormProps) {
  const [startDate, setStartDate] = useState(defaultCheckIn);
  const [endDate, setEndDate] = useState(defaultCheckOut);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | "">(defaultPropertyId || "");
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">(defaultRoomId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  // 記住查詢當下的日期，避免使用者查完後又改日期造成顯示與結果不一致
  const [searchedCheckIn, setSearchedCheckIn] = useState("");
  const [searchedCheckOut, setSearchedCheckOut] = useState("");

  // 訂房彈窗狀態
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    room: RoomAvailability | null;
    checkIn: string;
    checkOut: string;
    propertyId: number;
  }>({
    open: false,
    room: null,
    checkIn: "",
    checkOut: "",
    propertyId: 0,
  });

  // 根據選中的飯店過濾房型
  const availableRooms = selectedPropertyId
    ? properties.find((p) => p.id === selectedPropertyId)?.roomTypes || []
    : [];

  // 篩選：每間飯店最便宜、且整段日期都可訂的房間
  const bestRoomPerProperty = useMemo<BestRoomResult[]>(() => {
    if (availability.length === 0 || !searchedCheckIn || !searchedCheckOut) return [];
    const nightDates = getNightDates(searchedCheckIn, searchedCheckOut);
    if (nightDates.length === 0) return [];

    const propertyMap = new Map<number, HotelProperty>();
    for (const p of properties) propertyMap.set(p.id, p);

    const byProperty = new Map<number, BestRoomResult>();
    for (const room of availability) {
      const total = calcTotalPriceIfAvailable(room, nightDates);
      if (total == null) continue;
      const property = propertyMap.get(room.propertyId);
      if (!property) continue;
      const existing = byProperty.get(room.propertyId);
      if (!existing || total < existing.totalPrice) {
        byProperty.set(room.propertyId, {
          property,
          room,
          totalPrice: total,
          nights: nightDates.length,
          currency: property.currency || "JPY",
        });
      }
    }
    return Array.from(byProperty.values()).sort((a, b) => a.totalPrice - b.totalPrice);
  }, [availability, searchedCheckIn, searchedCheckOut, properties]);

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError("請選擇入住日期和退房日期");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("退房日期必須晚於入住日期");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAvailability([]);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      if (selectedPropertyId) {
        params.append("propertyId", selectedPropertyId.toString());
      }

      if (selectedRoomId) {
        params.append("roomId", selectedRoomId.toString());
      }

      const response = await fetch(`/api/availability?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAvailability(result.data || []);
        setSearchedCheckIn(startDate);
        setSearchedCheckOut(endDate);
      } else {
        setError(result.error || "查詢失敗");
      }
    } catch (err) {
      setError("網路錯誤，請稍後再試");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setSelectedPropertyId("");
    setSelectedRoomId("");
    setAvailability([]);
    setError(null);
    setHasSearched(false);
    setSearchedCheckIn("");
    setSearchedCheckOut("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>查詢空房狀態</CardTitle>
          <CardDescription>選擇入住與退房日期，系統將列出每間飯店符合日期的最低價房型</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* 日期選擇 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">入住日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">退房日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            {/* 飯店選擇 */}
            <div className="space-y-2">
              <Label htmlFor="propertyId">飯店（選填）</Label>
              <select
                id="propertyId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value ? Number(e.target.value) : "");
                  setSelectedRoomId(""); // 重置房型選擇
                }}
              >
                <option value="">所有飯店</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 房型選擇 */}
            {selectedPropertyId && availableRooms.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="roomId">房型（選填）</Label>
                <select
                  id="roomId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">所有房型</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                {isLoading ? "查詢中..." : "查詢空房"}
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={isLoading}>
                重置
              </Button>
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 查詢結果 - 飯店卡片列表 */}
      {hasSearched && !isLoading && !error && (
        <div className="space-y-4">
          {bestRoomPerProperty.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground">
                找到 {bestRoomPerProperty.length} 間符合日期的飯店（依總價由低至高）
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {bestRoomPerProperty.map((item) => {
                  const img = getPropertyPrimaryImage(item.property.id);
                  const avgPerNight = Math.round(item.totalPrice / item.nights);
                  const location = [item.property.city, item.property.country]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <Card
                      key={item.property.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {img ? (
                          <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-muted shrink-0">
                            <Image
                              src={img.path}
                              alt={img.alt}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 192px"
                            />
                          </div>
                        ) : (
                          <div className="w-full sm:w-48 h-48 bg-muted shrink-0 flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">暫無圖片</span>
                          </div>
                        )}
                        <div className="flex-1 p-4 flex flex-col min-w-0">
                          <h3 className="text-lg font-bold mb-1 line-clamp-1">
                            {item.property.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                            {item.room.name}
                          </p>
                          {location && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                              {location}
                            </p>
                          )}
                          <div className="mt-auto space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {item.nights} 晚 · 每晚約 ¥{avgPerNight.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xl font-bold text-primary">
                                ¥{item.totalPrice.toLocaleString()}
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setBookingDialog({
                                    open: true,
                                    room: item.room,
                                    checkIn: searchedCheckIn,
                                    checkOut: searchedCheckOut,
                                    propertyId: item.property.id,
                                  })
                                }
                              >
                                立即預訂
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-2">沒有符合您日期的飯店</p>
                <p className="text-sm text-muted-foreground">請嘗試調整日期區間或篩選條件</p>
              </CardContent>
            </Card>
          )}

          {/* 訂房彈窗 */}
          {bookingDialog.room && (
            <BookingDialog
              open={bookingDialog.open}
              onClose={() => setBookingDialog({ ...bookingDialog, open: false })}
              room={bookingDialog.room}
              checkIn={bookingDialog.checkIn}
              checkOut={bookingDialog.checkOut}
              propertyId={bookingDialog.propertyId}
            />
          )}
        </div>
      )}
    </div>
  );
}
