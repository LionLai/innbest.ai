/**
 * 圖片配置使用範例
 * 
 * 這個文件展示如何在 React 組件中使用圖片配置
 */

import React from 'react';
import Image from 'next/image';
import {
  getPropertyImages,
  getPropertyPrimaryImage,
  getRoomImages,
  getRoomPrimaryImage,
  getRoomImagesByCount,
  hasRoomImages,
} from '@/lib/images-config';

// ============================================
// 範例 1: 顯示房產主圖
// ============================================
export function PropertyMainImage({ propertyId }: { propertyId: number }) {
  const primaryImage = getPropertyPrimaryImage(propertyId);

  if (!primaryImage) {
    return <div>無圖片</div>;
  }

  return (
    <Image
      src={primaryImage.path}
      alt={primaryImage.alt}
      width={800}
      height={600}
      priority
    />
  );
}

// ============================================
// 範例 2: 顯示房產所有圖片（輪播圖）
// ============================================
export function PropertyGallery({ propertyId }: { propertyId: number }) {
  const images = getPropertyImages(propertyId);

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image) => (
        <div key={image.path} className="relative aspect-video">
          <Image
            src={image.path}
            alt={image.alt}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  );
}

// ============================================
// 範例 3: 顯示房間卡片的主圖
// ============================================
export function RoomCard({ 
  propertyId, 
  roomId, 
  roomName 
}: { 
  propertyId: number; 
  roomId: number; 
  roomName: string; 
}) {
  const primaryImage = getRoomPrimaryImage(propertyId, roomId);
  const hasImages = hasRoomImages(propertyId, roomId);

  return (
    <div className="border rounded-lg overflow-hidden">
      {hasImages && primaryImage ? (
        <div className="relative h-48">
          <Image
            src={primaryImage.path}
            alt={primaryImage.alt}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">無圖片</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold">{roomName}</h3>
      </div>
    </div>
  );
}

// ============================================
// 範例 4: 顯示房間前 3 張圖片
// ============================================
export function RoomPreviewImages({ 
  propertyId, 
  roomId 
}: { 
  propertyId: number; 
  roomId: number; 
}) {
  const images = getRoomImagesByCount(propertyId, roomId, 3);

  return (
    <div className="flex gap-2">
      {images.map((image) => (
        <div key={image.path} className="relative w-24 h-24">
          <Image
            src={image.path}
            alt={image.alt}
            fill
            className="object-cover rounded"
          />
        </div>
      ))}
    </div>
  );
}

// ============================================
// 範例 5: 完整的房間圖片畫廊
// ============================================
export function RoomImageGallery({ 
  propertyId, 
  roomId 
}: { 
  propertyId: number; 
  roomId: number; 
}) {
  const images = getRoomImages(propertyId, roomId);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  if (images.length === 0) {
    return <div>此房間暫無圖片</div>;
  }

  return (
    <div className="space-y-4">
      {/* 主圖顯示 */}
      <div className="relative aspect-video">
        <Image
          src={images[selectedIndex].path}
          alt={images[selectedIndex].alt}
          fill
          className="object-cover rounded-lg"
          priority
        />
      </div>

      {/* 縮圖列表 */}
      <div className="grid grid-cols-6 gap-2">
        {images.map((image, index) => (
          <button
            key={image.path}
            onClick={() => setSelectedIndex(index)}
            className={`relative aspect-square ${
              index === selectedIndex ? 'ring-2 ring-primary' : ''
            }`}
          >
            <Image
              src={image.path}
              alt={image.alt}
              fill
              className="object-cover rounded"
            />
          </button>
        ))}
      </div>

      {/* 圖片計數 */}
      <div className="text-center text-sm text-gray-500">
        {selectedIndex + 1} / {images.length}
      </div>
    </div>
  );
}

// ============================================
// 範例 6: 在 API 響應中包含圖片
// ============================================
export async function getRoomDataWithImages(propertyId: number, roomId: number) {
  const images = getRoomImages(propertyId, roomId);
  const primaryImage = getRoomPrimaryImage(propertyId, roomId);

  return {
    roomId,
    propertyId,
    // ... 其他房間數據
    images,
    primaryImage,
    imageCount: images.length,
  };
}

