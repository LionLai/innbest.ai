/**
 * 房間和物業過濾器
 * 用於在整個系統中排除特定的物業或房間
 * 
 * 配置來源：環境變數
 * - EXCLUDE_PROPERTY_IDS: 排除的物業 ID（逗號分隔）
 * - EXCLUDE_ROOM_IDS: 排除的房間 ID（逗號分隔）
 */

export interface FilterConfig {
  excludedPropertyIds: number[];
  excludedRoomIds: number[];
}

/**
 * 從環境變數載入過濾配置
 */
export function getFilterConfig(): FilterConfig {
  const excludePropertyIds = process.env.EXCLUDE_PROPERTY_IDS || '';
  const excludeRoomIds = process.env.EXCLUDE_ROOM_IDS || '';

  return {
    excludedPropertyIds: excludePropertyIds
      ? excludePropertyIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      : [],
    excludedRoomIds: excludeRoomIds
      ? excludeRoomIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      : [],
  };
}

/**
 * 檢查物業是否應該被排除
 */
export function shouldExcludeProperty(propertyId: number): boolean {
  const config = getFilterConfig();
  return config.excludedPropertyIds.includes(propertyId);
}

/**
 * 檢查房間是否應該被排除
 */
export function shouldExcludeRoom(roomId: number, propertyId?: number): boolean {
  const config = getFilterConfig();
  
  // 檢查房間 ID
  if (config.excludedRoomIds.includes(roomId)) {
    return true;
  }
  
  // 如果提供了物業 ID，也檢查物業是否被排除
  if (propertyId && config.excludedPropertyIds.includes(propertyId)) {
    return true;
  }
  
  return false;
}

/**
 * 過濾物業列表
 */
export function filterProperties<T extends { id?: number }>(properties: T[]): T[] {
  const config = getFilterConfig();
  
  if (config.excludedPropertyIds.length === 0) {
    return properties;
  }
  
  const filtered = properties.filter(p => p.id && !config.excludedPropertyIds.includes(p.id));
  
  if (filtered.length < properties.length) {
    console.log(`🔍 [Filter] 過濾物業: ${properties.length} → ${filtered.length} (-${properties.length - filtered.length})`);
  }
  
  return filtered;
}

/**
 * 過濾訂單列表
 */
export function filterBookings<T extends { propertyId?: number; roomId?: number }>(bookings: T[]): T[] {
  const config = getFilterConfig();
  
  if (config.excludedPropertyIds.length === 0 && config.excludedRoomIds.length === 0) {
    return bookings;
  }
  
  const filtered = bookings.filter(b => {
    if (b.propertyId && config.excludedPropertyIds.includes(b.propertyId)) {
      return false;
    }
    if (b.roomId && config.excludedRoomIds.includes(b.roomId)) {
      return false;
    }
    return true;
  });
  
  if (filtered.length < bookings.length) {
    console.log(`🔍 [Filter] 過濾訂單: ${bookings.length} → ${filtered.length} (-${bookings.length - filtered.length})`);
  }
  
  return filtered;
}

/**
 * 過濾房間列表
 */
export function filterRooms<T extends { id?: number }>(rooms: T[]): T[] {
  const config = getFilterConfig();
  
  if (config.excludedRoomIds.length === 0) {
    return rooms;
  }
  
  const filtered = rooms.filter(r => r.id && !config.excludedRoomIds.includes(r.id));
  
  if (filtered.length < rooms.length) {
    console.log(`🔍 [Filter] 過濾房間: ${rooms.length} → ${filtered.length} (-${rooms.length - filtered.length})`);
  }
  
  return filtered;
}

/**
 * 過濾物業的房間類型列表
 */
export function filterPropertyRooms<T extends { id?: number; roomTypes?: any[] }>(properties: T[]): T[] {
  const config = getFilterConfig();
  
  if (config.excludedRoomIds.length === 0) {
    return properties;
  }
  
  return properties.map(property => {
    if (!property.roomTypes || !Array.isArray(property.roomTypes)) {
      return property;
    }
    
    const filteredRoomTypes = property.roomTypes.filter(
      room => room.id && !config.excludedRoomIds.includes(room.id)
    );
    
    return {
      ...property,
      roomTypes: filteredRoomTypes,
    };
  });
}

/**
 * 記錄當前過濾配置（用於調試）
 */
export function logFilterConfig(): void {
  const config = getFilterConfig();
  
  if (config.excludedPropertyIds.length === 0 && config.excludedRoomIds.length === 0) {
    console.log('🔍 [Filter] 無排除配置');
    return;
  }
  
  console.log('🔍 [Filter] 排除配置:');
  if (config.excludedPropertyIds.length > 0) {
    console.log(`   - 物業: ${config.excludedPropertyIds.join(', ')}`);
  }
  if (config.excludedRoomIds.length > 0) {
    console.log(`   - 房間: ${config.excludedRoomIds.join(', ')}`);
  }
}
