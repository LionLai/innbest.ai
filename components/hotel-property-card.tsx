"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { HotelProperty } from "@/lib/types/hotel";
import { 
  getPropertyPrimaryImage, 
  getRoomPrimaryImage,
  hasRoomImages 
} from "@/lib/images-config";

interface HotelPropertyCardProps {
  property: HotelProperty;
}

export function HotelPropertyCard({ property }: HotelPropertyCardProps) {
  const router = useRouter();
  const propertyImage = getPropertyPrimaryImage(property.id);

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* 房產主圖 */}
      {propertyImage && (
        <div className="relative h-64 w-full bg-muted">
          <Image
            src={propertyImage.path}
            alt={propertyImage.alt}
            fill
            className="object-cover"
            priority
          />
          {/* 疊加漸層效果 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* 房產名稱疊加在圖片上 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">{property.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {(property.city || property.address || property.country) && (
                <span className="flex items-center gap-1 text-white/90">
                  📍 {[property.address, property.city, property.country].filter(Boolean).join(', ')}
                </span>
              )}
              {property.propertyType && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {property.propertyType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 沒有圖片時的 Header */}
      {!propertyImage && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{property.name}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {(property.city || property.address || property.country) && (
                    <span className="flex items-center gap-1">
                      📍 {[property.address, property.city, property.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {property.propertyType && (
                    <Badge variant="outline">
                      {property.propertyType}
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-4 text-base">
              房型選擇 ({property.roomTypes.length})
            </h4>
            {/* Grid 布局 - 塊狀卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.roomTypes.length > 0 ? (
                property.roomTypes.map((room) => {
                  const roomImage = getRoomPrimaryImage(property.id, room.id);
                  const hasImages = hasRoomImages(property.id, room.id);

                  return (
                    <div
                      key={room.id}
                      className="flex flex-col rounded-lg border bg-card hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* 房間圖片 - 可點擊查看詳情 */}
                      {hasImages && roomImage ? (
                        <Link 
                          href={`/rooms/${property.id}/${room.id}`}
                          className="relative w-full h-48 bg-muted group cursor-pointer"
                        >
                          <Image
                            src={roomImage.path}
                            alt={roomImage.alt}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          {/* 懸浮提示 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3">
                              <Eye className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground">
                          暫無圖片
                        </div>
                      )}

                      {/* 房間資訊 */}
                      <div className="p-4 flex flex-col flex-1">
                        <h5 className="font-semibold text-lg mb-3">{room.name}</h5>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {room.roomType && (
                            <Badge variant="secondary">
                              {room.roomType}
                            </Badge>
                          )}
                          {room.maxPeople && (
                            <Badge variant="outline">
                              👥 {room.maxPeople} 人
                            </Badge>
                          )}
                          {room.qty && room.qty > 0 && (
                            <Badge variant="outline">
                              🏠 {room.qty} 間
                            </Badge>
                          )}
                        </div>

                        {/* 按鈕組 */}
                        <div className="mt-auto flex gap-2">
                          <Link 
                            href={`/rooms/${property.id}/${room.id}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              查看詳情
                            </Button>
                          </Link>
                          <button
                            onClick={() => {
                              // 計算預設日期（今天和30天後）
                              const today = new Date();
                              const checkIn = today.toISOString().split('T')[0];
                              
                              const checkOutDate = new Date(today);
                              checkOutDate.setDate(checkOutDate.getDate() + 30);
                              const checkOut = checkOutDate.toISOString().split('T')[0];
                              
                              // 導航到查詢空房頁面，並預選房型及日期
                              router.push(`/availability?propertyId=${property.id}&roomId=${room.id}&checkin=${checkIn}&checkout=${checkOut}`);
                            }}
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md font-medium transition-colors"
                          >
                            預訂
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-sm text-muted-foreground text-center py-8">
                  此飯店目前沒有可預訂的房型
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

