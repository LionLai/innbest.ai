"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ChevronDown, ChevronUp, MapPin, ExternalLink } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const propertyImage = getPropertyPrimaryImage(property.id);

  // 格式化完整地址
  const fullAddress = [property.address, property.city, property.country]
    .filter(Boolean)
    .join(', ');

  // 生成 Google Maps URL
  const googleMapsUrl = fullAddress 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* 橫向布局：左側圖片 + 右側內容 */}
      <div className="flex flex-col md:flex-row">
        {/* 左側：房產主圖 */}
        {propertyImage ? (
          <div className="relative w-full md:w-80 lg:w-96 aspect-square md:h-80 lg:h-96 bg-muted shrink-0 md:self-start">
            <Image
              src={propertyImage.path}
              alt={propertyImage.alt}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full md:w-80 lg:w-96 aspect-square md:h-80 lg:h-96 bg-muted flex items-center justify-center shrink-0 md:self-start">
            <p className="text-muted-foreground text-lg">暫無圖片</p>
          </div>
        )}

        {/* 右側：飯店資訊 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header 區域 */}
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl mb-2">{property.name}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  {fullAddress && googleMapsUrl && (
                    <button
                      onClick={() => setIsMapOpen(true)}
                      className="flex items-center gap-1 text-foreground/70 hover:text-foreground hover:underline transition-all cursor-pointer group"
                    >
                      <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="line-clamp-1">{fullAddress}</span>
                    </button>
                  )}
                  {property.propertyType && (
                    <Badge variant="secondary">
                      {property.propertyType}
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
          </CardHeader>
          {/* Content 區域 */}
          <CardContent className="pt-0 pb-6 px-6 flex-1">
            <div className="space-y-4">
              {/* 摺疊/展開控制區域 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-base">
                    房型選擇
                  </h4>
                  <Badge variant="secondary" className="font-normal">
                    {property.roomTypes.length} 種房型
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="gap-2"
                >
                  {isExpanded ? (
                    <>
                      收起房型
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      展開查看房型
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* 房型列表 - 條件渲染 */}
              {isExpanded && (
                <div>
                  {/* Grid 布局 - 塊狀卡片 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              )}
            </div>
          </CardContent>
        </div>
      </div>

      {/* 地圖 Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              {property.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {fullAddress}
            </DialogDescription>
          </DialogHeader>
          
          {/* Google Maps iframe */}
          <div className="flex-1 w-full px-6 pb-4">
            {googleMapsUrl && (
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=m&z=15&output=embed&iwloc=near`}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '8px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${property.name} 地圖`}
              />
            )}
          </div>
          
          <DialogFooter className="p-6 pt-2">
            <Button
              variant="outline"
              onClick={() => googleMapsUrl && window.open(googleMapsUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              在 Google Maps 中開啟
            </Button>
            <Button onClick={() => setIsMapOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

