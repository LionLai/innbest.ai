"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import type { RoomAvailability, HotelProperty } from "@/lib/types/hotel";

interface AvailabilitySearchFormProps {
  properties: HotelProperty[];
}

export function AvailabilitySearchForm({ properties }: AvailabilitySearchFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | "">("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 根據選中的飯店過濾房型
  const availableRooms = selectedPropertyId
    ? properties.find((p) => p.id === selectedPropertyId)?.roomTypes || []
    : [];

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError("請選擇開始日期和結束日期");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAvailability([]);

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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>查詢空房狀態</CardTitle>
          <CardDescription>選擇入住日期與飯店，即時查詢空房狀況</CardDescription>
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

      {/* 查詢結果 - 月曆視圖 */}
      {availability.length > 0 && (
        <AvailabilityCalendar
          availability={availability}
          startDate={startDate}
          endDate={endDate}
          onBook={(room) => {
            const params = new URLSearchParams({
              roomId: room.roomId.toString(),
              propertyId: room.propertyId.toString(),
              startDate,
              endDate,
              roomName: room.name
            });
            router.push(`/book?${params.toString()}`);
          }}
        />
      )}
    </div>
  );
}

