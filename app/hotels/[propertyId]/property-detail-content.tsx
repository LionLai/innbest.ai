"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProperties } from "@/contexts/properties-context";
import { getPropertyImages, getRoomPrimaryImage, hasRoomImages } from "@/lib/images-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  MapPin, 
  ExternalLink, 
  Eye,
  Users,
  Home,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface PropertyDetailContentProps {
  propertyId: number;
}

export function PropertyDetailContent({ propertyId }: PropertyDetailContentProps) {
  const router = useRouter();
  const { properties, isLoading, error } = useProperties();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);

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

  // 查找對應的飯店
  const property = properties.find(p => p.id === propertyId);

  if (!property) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">找不到飯店</div>
            <p className="text-muted-foreground mb-4">
              該飯店可能不存在或已下架
            </p>
            <Button onClick={() => router.push('/hotels')}>
              返回飯店列表
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 獲取飯店圖片
  const propertyImages = getPropertyImages(propertyId);
  const currentImage = propertyImages[currentImageIndex];

  // 格式化完整地址
  const fullAddress = [property.address, property.city, property.country]
    .filter(Boolean)
    .join(', ');

  // 生成 Google Maps URL
  const googleMapsUrl = fullAddress 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? propertyImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === propertyImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 飯店主要資訊區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* 左側：圖片輪播 */}
        <div className="lg:col-span-2 space-y-4">
          {propertyImages.length > 0 ? (
            <>
              {/* 主圖片 */}
              <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden bg-black">
                <Image
                  src={currentImage.path}
                  alt={currentImage.alt}
                  fill
                  className="object-contain"
                  priority
                />
                
                {/* 圖片計數 */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm">
                  {currentImageIndex + 1} / {propertyImages.length}
                </div>

                {/* 導航按鈕 */}
                {propertyImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                      onClick={goToPrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                      onClick={goToNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* 縮圖導航 */}
              {propertyImages.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {propertyImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`
                        relative aspect-square rounded-md overflow-hidden border-2 transition-all
                        ${index === currentImageIndex 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-primary/50'
                        }
                      `}
                    >
                      <Image
                        src={image.path}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-[400px] md:h-[500px] bg-muted flex items-center justify-center rounded-lg">
              <p className="text-muted-foreground text-lg">暫無飯店照片</p>
            </div>
          )}
        </div>

        {/* 右側：飯店資訊 */}
        <div className="space-y-6">
          {/* 基本資訊 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
                {property.propertyType && (
                  <Badge variant="secondary" className="text-sm">
                    {property.propertyType}
                  </Badge>
                )}
              </div>

              {fullAddress && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{fullAddress}</p>
                    {googleMapsUrl && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setIsMapOpen(true)}
                        className="h-auto p-0 text-primary"
                      >
                        查看地圖
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 房型統計 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Home className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">可預訂房型</p>
                  <p className="text-2xl font-bold">{property.roomTypes.length} 種</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                滾動下方查看所有房型詳情
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 所有房型展示 */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">所有房型</h2>
          <p className="text-muted-foreground">
            選擇您喜歡的房型，查看詳細資訊或立即預訂
          </p>
        </div>

        {property.roomTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {property.roomTypes.map((room) => {
              const roomImage = getRoomPrimaryImage(property.id, room.id);
              const hasImages = hasRoomImages(property.id, room.id);

              return (
                <Card
                  key={room.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* 房間圖片 */}
                  {hasImages && roomImage ? (
                    <Link 
                      href={`/rooms/${property.id}/${room.id}`}
                      className="relative w-full h-56 bg-muted group cursor-pointer block"
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
                    <div className="w-full h-56 bg-muted flex items-center justify-center text-muted-foreground">
                      暫無圖片
                    </div>
                  )}

                  {/* 房間資訊 */}
                  <CardHeader>
                    <CardTitle className="text-xl">{room.name}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {room.roomType && (
                          <Badge variant="secondary">
                            {room.roomType}
                          </Badge>
                        )}
                        {room.maxPeople && (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {room.maxPeople} 人
                          </Badge>
                        )}
                        {room.qty && room.qty > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Home className="h-3 w-3" />
                            {room.qty} 間
                          </Badge>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex gap-2">
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
                          const today = new Date();
                          const checkIn = today.toISOString().split('T')[0];
                          const checkOutDate = new Date(today);
                          checkOutDate.setDate(checkOutDate.getDate() + 30);
                          const checkOut = checkOutDate.toISOString().split('T')[0];
                          router.push(`/availability?propertyId=${property.id}&roomId=${room.id}&checkin=${checkIn}&checkout=${checkOut}`);
                        }}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md font-medium transition-colors"
                      >
                        預訂
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">此飯店目前沒有可預訂的房型</p>
          </div>
        )}
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
    </div>
  );
}
