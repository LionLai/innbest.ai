"use client";

import { useRouter } from "next/navigation";
import { useProperties } from "@/contexts/properties-context";
import { getRoomImages } from "@/lib/images-config";
import { RoomImageGallery } from "@/components/room-image-gallery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Baby, 
  Home, 
  DollarSign,
  ArrowLeft,
  Calendar 
} from "lucide-react";

interface RoomDetailContentProps {
  propertyId: number;
  roomId: number;
}

export function RoomDetailContent({ propertyId, roomId }: RoomDetailContentProps) {
  const router = useRouter();
  const { properties, isLoading, error } = useProperties();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">載入房間資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">載入失敗</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/hotels')}>
              返回飯店列表
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 查找對應的房產和房間
  const property = properties.find(p => p.id === propertyId);
  const room = property?.roomTypes.find(r => r.id === roomId);

  if (!property || !room) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">找不到房間</div>
            <p className="text-muted-foreground mb-4">
              該房間可能不存在或已下架
            </p>
            <Button onClick={() => router.push('/hotels')}>
              返回飯店列表
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 獲取房間圖片
  const roomImages = getRoomImages(propertyId, roomId);

  // 計算預設日期（今天和30天後）
  const getDefaultDates = () => {
    const today = new Date();
    const checkIn = today.toISOString().split('T')[0];
    
    const checkOutDate = new Date(today);
    checkOutDate.setDate(checkOutDate.getDate() + 30);
    const checkOut = checkOutDate.toISOString().split('T')[0];
    
    return { checkIn, checkOut };
  };

  const handleBookRoom = () => {
    const { checkIn, checkOut } = getDefaultDates();
    router.push(`/availability?propertyId=${propertyId}&roomId=${roomId}&checkin=${checkIn}&checkout=${checkOut}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：圖片展示（佔2/3） */}
        <div className="lg:col-span-2 space-y-6">
          <RoomImageGallery images={roomImages} roomName={room.name} />
        </div>

        {/* 右側：房間資訊（佔1/3） */}
        <div className="space-y-6">
          {/* 房間標題和基本資訊 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
                <p className="text-muted-foreground">{property.name}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>📍</span>
                  <span>
                    {[property.address, property.city, property.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>

              {/* 房型標籤 */}
              {room.roomType && (
                <div>
                  <Badge variant="secondary" className="text-sm">
                    {room.roomType}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 房間規格 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">房間規格</h2>
              <div className="space-y-3">
                {room.maxPeople && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">最多入住人數</p>
                      <p className="text-sm text-muted-foreground">
                        {room.maxPeople} 人
                      </p>
                    </div>
                  </div>
                )}

                {room.maxAdult !== null && room.maxAdult !== undefined && (
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">成人</p>
                      <p className="text-sm text-muted-foreground">
                        最多 {room.maxAdult} 位
                      </p>
                    </div>
                  </div>
                )}

                {room.maxChildren !== null && room.maxChildren !== undefined && (
                  <div className="flex items-center gap-3">
                    <Baby className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">兒童</p>
                      <p className="text-sm text-muted-foreground">
                        最多 {room.maxChildren} 位
                      </p>
                    </div>
                  </div>
                )}

                {room.qty && room.qty > 0 && (
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">可預訂房間數</p>
                      <p className="text-sm text-muted-foreground">
                        {room.qty} 間
                      </p>
                    </div>
                  </div>
                )}
                
              {/* 有錢再放回來 
                {room.minPrice && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">起始價格</p>
                      <p className="text-sm text-muted-foreground">
                        {property.currency === 'JPY' ? '¥' : '$'}
                        {room.minPrice.toLocaleString()} / 晚
                      </p>
                    </div>
                  </div>
                )}
              */}

              </div>
            </CardContent>
          </Card>

          {/* 預訂按鈕 */}
          <Card className="border-primary border-2">
            <CardContent className="p-6">
              <Button 
                onClick={handleBookRoom}
                size="lg"
                className="w-full text-lg h-14"
              >
                <Calendar className="h-5 w-5 mr-2" />
                查詢空房並預訂
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                點擊後將前往空房查詢頁面
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 房間說明（可選，如果有的話） */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">關於此房型</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              {room.name} 位於 {property.name}，提供舒適的住宿體驗。
              {room.maxPeople && `房間可容納最多 ${room.maxPeople} 位賓客。`}
            </p>
            <p className="mt-4">
              我們的房間配備完善的設施，確保您擁有愉快的入住體驗。
              如需了解更多資訊或查詢即時房價，請點擊上方的「查詢空房並預訂」按鈕。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

