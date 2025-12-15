"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RoomAvailability } from "@/lib/types/hotel";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AvailabilityCalendarProps {
  availability: RoomAvailability[];
  startDate: string;
  endDate: string;
  onBook?: (room: RoomAvailability) => void;
}

interface DayData {
  date: string;
  dateObj: Date;
  isAvailable: boolean;
  price?: number;
  isInRange: boolean;
  isToday: boolean;
}

export function AvailabilityCalendar({ 
  availability, 
  startDate, 
  endDate,
  onBook 
}: AvailabilityCalendarProps) {
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(startDate));

  const selectedRoom = availability[selectedRoomIndex];

  // 生成月曆數據
  const calendarData = useMemo(() => {
    if (!selectedRoom) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 獲取月份的第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 獲取第一天是星期幾（0 = 週日）
    const firstDayOfWeek = firstDay.getDay();
    
    // 獲取這個月有多少天
    const daysInMonth = lastDay.getDate();
    
    // 構建日曆數據（包含空白日期）
    const days: (DayData | null)[] = [];
    
    // 添加月初的空白
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // 添加月份的每一天
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        dateObj,
        isAvailable: selectedRoom.availability[dateStr] ?? false,
        price: selectedRoom.prices?.[dateStr],
        isInRange: dateObj >= start && dateObj <= end,
        isToday: dateObj.getTime() === today.getTime(),
      });
    }
    
    return days;
  }, [selectedRoom, currentMonth, startDate, endDate]);

  // 導航到上個月
  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  // 導航到下個月
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  // 格式化月份標題
  const monthTitle = currentMonth.toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'long' 
  });

  if (!selectedRoom) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">沒有可用的房間資料</p>
        </CardContent>
      </Card>
    );
  }

  // 檢查是否完全有空房
  const dates = Object.keys(selectedRoom.availability);
  const availableDates = dates.filter((date) => selectedRoom.availability[date]);
  const isFullyAvailable = dates.length > 0 && availableDates.length === dates.length;

  return (
    <div className="space-y-6">
      {/* 房型選擇 */}
      {availability.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">選擇房型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availability.map((room, index) => (
                <Button
                  key={`${room.propertyId}-${room.roomId}`}
                  variant={selectedRoomIndex === index ? "default" : "outline"}
                  onClick={() => setSelectedRoomIndex(index)}
                  className="flex-1 min-w-[140px] sm:min-w-[200px] text-sm"
                >
                  {room.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 月曆視圖 */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">{selectedRoom.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                <span className="block sm:inline">{startDate} 至 {endDate}</span>
                {selectedRoom.currency && (
                  <span className="block sm:inline sm:ml-2 text-xs">
                    貨幣：{selectedRoom.currency}
                  </span>
                )}
              </CardDescription>
            </div>
            {isFullyAvailable && onBook && (
              <Button 
                onClick={() => onBook(selectedRoom)}
                className="w-full sm:w-auto"
                size="sm"
              >
                立即預訂
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 月份導航 */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevMonth}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <h3 className="text-base sm:text-lg font-semibold">{monthTitle}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日曆格子 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarData.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayNum = day.dateObj.getDate();
              
              return (
                <div
                  key={day.date}
                  className={`
                    relative aspect-square border rounded-md sm:rounded-lg p-1 sm:p-2 
                    transition-all duration-200 flex flex-col
                    ${day.isInRange ? 'ring-1 sm:ring-2 ring-primary/20' : ''}
                    ${day.isToday ? 'border-primary border-2' : ''}
                    ${day.isAvailable 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/30' 
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }
                  `}
                >
                  {/* 日期 */}
                  <div className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">
                    {dayNum}
                  </div>
                  
                  {/* 狀態標記 - 手機版簡化為小圓點 */}
                  {day.isInRange && (
                    <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1">
                      {/* 手機版：小圓點 */}
                      <div className="sm:hidden">
                        {day.isAvailable ? (
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-red-600" />
                        )}
                      </div>
                      {/* 桌面版：Badge */}
                      <div className="hidden sm:block">
                        {day.isAvailable ? (
                          <Badge 
                            variant="default" 
                            className="h-5 px-1 text-[10px] bg-green-600"
                          >
                            ✓
                          </Badge>
                        ) : (
                          <Badge 
                            variant="destructive" 
                            className="h-5 px-1 text-[10px]"
                          >
                            ✗
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 價格 - 手機版只在有空房時顯示 */}
                  {day.price && day.isInRange && (
                    <div className={`
                      text-[10px] sm:text-xs font-bold mt-auto leading-tight
                      ${day.isAvailable 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300 hidden sm:block'
                      }
                    `}>
                      ¥{day.price.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 圖例 */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-primary shrink-0" />
                <span className="text-muted-foreground">今天</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 shrink-0" />
                <span className="text-muted-foreground">有空房</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 shrink-0" />
                <span className="text-muted-foreground">無空房</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-primary/20 shrink-0" />
                <span className="text-muted-foreground">查詢範圍</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

