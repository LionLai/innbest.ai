import imagesConfig from '@/public/images/images-config.json';

// TypeScript 類型定義
export interface ImageInfo {
  path: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface RoomImages {
  roomId: number;
  name: string;
  images: ImageInfo[];
}

export interface PropertyImages {
  propertyId: number;
  name: string;
  images: ImageInfo[];
  rooms: Record<string, RoomImages>;
}

export interface ImagesConfig {
  properties: Record<string, PropertyImages>;
}

// 類型轉換
const config = imagesConfig as ImagesConfig;

/**
 * 獲取房產的圖片
 */
export function getPropertyImages(propertyId: number): ImageInfo[] {
  const property = config.properties[propertyId.toString()];
  return property?.images || [];
}

/**
 * 獲取房產的主圖
 */
export function getPropertyPrimaryImage(propertyId: number): ImageInfo | null {
  const images = getPropertyImages(propertyId);
  return images.find(img => img.isPrimary) || images[0] || null;
}

/**
 * 獲取房間的所有圖片
 */
export function getRoomImages(propertyId: number, roomId: number): ImageInfo[] {
  const property = config.properties[propertyId.toString()];
  const room = property?.rooms[roomId.toString()];
  return room?.images || [];
}

/**
 * 獲取房間的主圖
 */
export function getRoomPrimaryImage(propertyId: number, roomId: number): ImageInfo | null {
  const images = getRoomImages(propertyId, roomId);
  return images.find(img => img.isPrimary) || images[0] || null;
}

/**
 * 獲取房間的前 N 張圖片
 */
export function getRoomImagesByCount(
  propertyId: number, 
  roomId: number, 
  count: number
): ImageInfo[] {
  const images = getRoomImages(propertyId, roomId);
  return images.slice(0, count);
}

/**
 * 獲取所有房產配置
 */
export function getAllProperties(): PropertyImages[] {
  return Object.values(config.properties);
}

/**
 * 獲取房產的所有房間配置
 */
export function getPropertyRooms(propertyId: number): RoomImages[] {
  const property = config.properties[propertyId.toString()];
  return property ? Object.values(property.rooms) : [];
}

/**
 * 檢查房間是否有圖片
 */
export function hasRoomImages(propertyId: number, roomId: number): boolean {
  const images = getRoomImages(propertyId, roomId);
  return images.length > 0;
}

/**
 * 獲取圖片的完整 URL（用於 Next.js Image 組件）
 */
export function getImageUrl(imagePath: string): string {
  return imagePath; // Next.js 會自動處理 /images 路徑
}

