/**
 * 清掃任務自動同步系統
 * 從 Beds24 同步訂單並自動生成清掃任務
 * 所有時間以日本時區（JST, GMT+9）為基準
 */

import { prisma } from './prisma';
import { beds24Client, getBeds24Headers } from './beds24-client';
import type { CleaningTeam, CleaningUrgency } from './generated/prisma';
import { getTodayInTokyo, formatDateInTokyo, dateToUTC } from './timezone-utils';
import { shouldExcludeRoom, logFilterConfig } from './filters/room-filter';

interface SyncStats {
  created: number;
  updated: number;
  cancelled: number;
  errors: string[];
}

/**
 * 從 Beds24 同步訂單並自動生成清掃任務
 * 每天凌晨 2:00 執行
 * 
 * 策略：一次抓取所有訂單，在記憶體中處理所有邏輯
 */
export async function syncCleaningTasksFromBeds24(): Promise<SyncStats> {
  const stats: SyncStats = {
    created: 0,
    updated: 0,
    cancelled: 0,
    errors: [],
  };

  console.log('🔄 開始同步清掃任務...');
  
  // 記錄過濾配置
  logFilterConfig();

  try {
    const headers = await getBeds24Headers();
    
    // 使用日本時間計算"今天"（業務邏輯基準）
    const todayJST = getTodayInTokyo();
    const todayStr = formatDateInTokyo(todayJST);
    
    // 計算一年後的日期
    const endDateJST = new Date(todayJST);
    endDateJST.setFullYear(endDateJST.getFullYear() + 1);
    const endDateStr = formatDateInTokyo(endDateJST);
    
    console.log(`📅 查詢確認訂單（退房日期: ${todayStr} ~ ${endDateStr}）[日本時間基準]`);
    
    // 轉換為 UTC 存儲格式（用於資料庫操作）
    const today = dateToUTC(todayStr);

    const { data, error } = await beds24Client.GET('/bookings', {
      headers,
      params: {
        query: {
          departureFrom: todayStr, // 從今天開始
          departureTo: endDateStr,  // 到未來一年
        },
      },
    });

    if (error || !data?.data) {
      const errorMsg = '無法獲取 Beds24 訂單';
      console.error('❌', errorMsg, error);
      stats.errors.push(errorMsg);
      return stats;
    }

    const allBookings = data.data;
    console.log(`📦 獲取到 ${allBookings.length} 筆訂單`);
    
    // 調試：顯示前 3 筆訂單的完整資料
    if (allBookings.length > 0) {
      console.log('🔍 訂單資料結構檢查（前3筆）:');
      allBookings.slice(0, 3).forEach((booking: any, index: number) => {
        console.log(`\n訂單 ${index + 1}:`);
        console.log(`  - ID: ${booking.id}`);
        console.log(`  - propertyId: ${booking.propertyId}`);
        console.log(`  - roomId: ${booking.roomId}`);
        console.log(`  - roomName: ${booking.roomName || 'N/A'}`);
        console.log(`  - status: ${booking.status}`);
        console.log(`  - arrival: ${booking.arrival}`);
        console.log(`  - departure: ${booking.departure}`);
      });
    }

    // 2. 獲取所有物業名稱和房間名稱（用於冗餘存儲）
    const { propertyNames, roomNames } = await getPropertyAndRoomNames();

    // 3. 獲取所有清掃團隊（用於自動分配）
    const cleaningTeams = await prisma.cleaningTeam.findMany({
      where: { isActive: true },
    });

    // 4. 建立房間到訂單的映射（用於快速查找下一筆入住）
    // 按房間 ID 分組，並按入住日期排序
    const roomBookingsMap = new Map<number, any[]>();
    
    for (const booking of allBookings) {
      if (!booking.roomId || !booking.arrival || !booking.departure) continue;
      
      if (!roomBookingsMap.has(booking.roomId)) {
        roomBookingsMap.set(booking.roomId, []);
      }
      roomBookingsMap.get(booking.roomId)!.push(booking);
    }
    
    // 對每個房間的訂單按入住日期排序
    for (const [roomId, bookings] of roomBookingsMap.entries()) {
      bookings.sort((a, b) => {
        const dateA = new Date(a.arrival!).getTime();
        const dateB = new Date(b.arrival!).getTime();
        return dateA - dateB;
      });
    }
    
    console.log(`🗂️  建立 ${roomBookingsMap.size} 個房間的訂單映射`);

    // 5. 按退房時間升冪排序（從早到晚）
    allBookings.sort((a, b) => {
      const dateA = a.departure ? new Date(a.departure).getTime() : 0;
      const dateB = b.departure ? new Date(b.departure).getTime() : 0;
      return dateA - dateB; // 升冪排列
    });
    
    console.log(`📊 按退房時間排序完成`);

    // 6. 篩選有效訂單並處理
    let processedCount = 0;
    let skippedCount = 0;
    const skipReasons: Record<string, number> = {
      noDeparture: 0,
      noPropertyId: 0,
      noRoomId: 0,
      noBookingId: 0,
      excluded: 0,
    };

    for (const booking of allBookings) {
      try {
        // 檢查必要欄位
        if (!booking.id) {
          console.warn(`⚠️  訂單 ${booking.id} 缺少 id`);
          skipReasons.noBookingId++;
          skippedCount++;
          continue;
        }
        
        if (!booking.departure) {
          console.warn(`⚠️  訂單 ${booking.id} 缺少 departure`);
          skipReasons.noDeparture++;
          skippedCount++;
          continue;
        }
        
        if (!booking.propertyId) {
          console.warn(`⚠️  訂單 ${booking.id} 缺少 propertyId`);
          skipReasons.noPropertyId++;
          skippedCount++;
          continue;
        }
        
        if (!booking.roomId) {
          console.warn(`⚠️  訂單 ${booking.id} 缺少 roomId`);
          skipReasons.noRoomId++;
          skippedCount++;
          continue;
        }

        const beds24BookingId = booking.id;
        const propertyId = booking.propertyId;
        const roomId = booking.roomId;
        
        // 檢查是否在排除清單中
        if (shouldExcludeRoom(roomId, propertyId)) {
          console.log(`⏭️  跳過訂單 ${beds24BookingId}（房間 ${roomId} 已排除）`);
          skipReasons.excluded++;
          skippedCount++;
          continue;
        }
        
        // 將 Beds24 日期轉換為 UTC 午夜（資料庫存儲格式）
        const checkOutDate = dateToUTC(booking.departure);
        
        // 調試：記錄前5筆訂單的退房日期資訊
        if (processedCount < 5) {
          console.log(`\n📋 處理訂單 ${beds24BookingId}:`);
          console.log(`   arrival: ${booking.arrival}`);
          console.log(`   departure: ${booking.departure}`);
          console.log(`   退房日期（UTC 存儲）: ${checkOutDate.toISOString()}`);
          console.log(`   物業: ${propertyId}, 房間: ${roomId}`);
        }
        
        processedCount++;

        // 獲取房間名稱（優先使用 Beds24 properties API 的名稱）
        const roomName = roomNames.get(roomId) || booking.roomName || `Room ${roomId}`;
        const propertyName = propertyNames.get(propertyId) || `Property ${propertyId}`;

        // 在記憶體中查找該房間的下一筆入住
        const nextBooking = findNextBookingInMemory(roomId, checkOutDate, roomBookingsMap);

        // 計算優先級
        const urgency = calculateCleaningUrgency(
          checkOutDate,
          nextBooking?.arrival
        );

        // 分配團隊
        const team = assignCleaningTeam(propertyId, cleaningTeams);

        // 準備任務數據
        const taskData = {
          propertyId,
          propertyName,
          roomId,
          roomName,
          checkOutDate,
          checkOutTime: '12:00',
          cleaningDate: checkOutDate, // 退房當天清掃
          nextCheckIn: nextBooking?.arrival ? dateToUTC(nextBooking.arrival) : null,
          urgency,
          teamId: team?.id || null,
          lastSyncAt: new Date(),
        };

        // 檢查是否已存在任務
        const existingTask = await prisma.cleaningTask.findUnique({
          where: { beds24BookingId },
        });

        if (existingTask) {
          // 更新現有任務
          await prisma.cleaningTask.update({
            where: { id: existingTask.id },
            data: taskData,
          });
          stats.updated++;
          console.log(`✏️  更新任務: ${roomName} (${checkOutDate.toISOString().split('T')[0]})`);
        } else {
          // 創建新任務
          await prisma.cleaningTask.create({
            data: {
              beds24BookingId,
              ...taskData,
              status: 'PENDING',
            },
          });
          stats.created++;
          console.log(`➕ 創建任務: ${roomName} (${checkOutDate.toISOString().split('T')[0]})`);
        }
      } catch (error) {
        const errorMsg = `處理訂單 ${booking.id} 時發生錯誤: ${error}`;
        console.error('❌', errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // 7. 處理取消的訂單
    // 找出在資料庫中但不在 Beds24 中的訂單
    const beds24BookingIds = allBookings.map(b => b.id!).filter(Boolean);
    
    const cancelledTasks = await prisma.cleaningTask.updateMany({
      where: {
        beds24BookingId: { notIn: beds24BookingIds },
        status: { in: ['PENDING', 'NOTIFIED'] },
        cleaningDate: { gte: today },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    stats.cancelled = cancelledTasks.count;

    console.log('✅ 清掃任務同步完成');
    console.log(`📊 統計資訊:`);
    console.log(`   - 獲取訂單: ${allBookings.length} 筆`);
    console.log(`   - 成功處理: ${processedCount} 筆`);
    console.log(`   - 跳過訂單: ${skippedCount} 筆`);
    if (skippedCount > 0) {
      console.log(`   跳過原因:`);
      if (skipReasons.noBookingId > 0) console.log(`     • 無訂單ID: ${skipReasons.noBookingId} 筆`);
      if (skipReasons.noDeparture > 0) console.log(`     • 無退房日期: ${skipReasons.noDeparture} 筆`);
      if (skipReasons.noPropertyId > 0) console.log(`     • 無物業ID: ${skipReasons.noPropertyId} 筆`);
      if (skipReasons.noRoomId > 0) console.log(`     • 無房間ID: ${skipReasons.noRoomId} 筆`);
      if (skipReasons.excluded > 0) console.log(`     • 已排除（過濾器）: ${skipReasons.excluded} 筆`);
    }
    console.log(`   - 新增任務: ${stats.created} 個`);
    console.log(`   - 更新任務: ${stats.updated} 個`);
    console.log(`   - 取消任務: ${stats.cancelled} 個`);
    
    if (stats.errors.length > 0) {
      console.warn(`⚠️  發生 ${stats.errors.length} 個錯誤`);
      stats.errors.forEach(err => console.error(`   ❌ ${err}`));
    }

    return stats;
  } catch (error) {
    console.error('❌ 清掃任務同步失敗:', error);
    stats.errors.push(`系統錯誤: ${error}`);
    throw error;
  }
}

/**
 * 獲取所有物業和房間的名稱映射
 */
async function getPropertyAndRoomNames(): Promise<{
  propertyNames: Map<number, string>;
  roomNames: Map<number, string>;
}> {
  const propertyNames = new Map<number, string>();
  const roomNames = new Map<number, string>();

  try {
    const headers = await getBeds24Headers();
    const { data } = await beds24Client.GET('/properties', {
      headers,
      params: {
        query: {
          includeAllRooms: true, // 包含所有房間資訊
        },
      },
    });

    if (data?.data) {
      data.data.forEach((property: any) => {
        // 記錄物業名稱
        if (property.id && property.name) {
          propertyNames.set(property.id, property.name);
        }

        // 記錄房間名稱
        if (property.roomTypes && Array.isArray(property.roomTypes)) {
          property.roomTypes.forEach((roomType: any) => {
            if (roomType.id && roomType.name) {
              roomNames.set(roomType.id, roomType.name);
            }
          });
        }
      });
    }

    console.log(`📍 獲取到 ${propertyNames.size} 個物業名稱，${roomNames.size} 個房間名稱`);
  } catch (error) {
    console.warn('⚠️  無法獲取物業/房間名稱:', error);
  }

  return { propertyNames, roomNames };
}

/**
 * 在記憶體中查找房間的下一筆入住訂單
 * @param roomId 房間 ID
 * @param checkOutDate 當前訂單的退房日期
 * @param roomBookingsMap 房間訂單映射表（已按入住日期排序）
 */
function findNextBookingInMemory(
  roomId: number,
  checkOutDate: Date,
  roomBookingsMap: Map<number, any[]>
): { arrival: string } | null {
  const roomBookings = roomBookingsMap.get(roomId);
  if (!roomBookings || roomBookings.length === 0) {
    return null;
  }

  // 查找退房日期當天或之後的第一筆入住
  for (const booking of roomBookings) {
    // 將入住日期轉換為 UTC（與 checkOutDate 格式一致）
    const arrivalDate = dateToUTC(booking.arrival!);
    
    if (arrivalDate >= checkOutDate) {
      console.log(`   🔍 找到下一筆入住: ${booking.arrival} (房間 ${roomId})`);
      return { arrival: booking.arrival! };
    }
  }

  console.log(`   ℹ️  房間 ${roomId} 無下一筆入住`);
  return null;
}

/**
 * 計算清掃優先級
 */
function calculateCleaningUrgency(
  checkOutDate: Date,
  nextCheckInDate?: string
): CleaningUrgency {
  if (!nextCheckInDate) {
    return 'LOW'; // 沒有下一筆入住
  }

  // 將入住日期轉換為 UTC（與 checkOutDate 格式一致）
  const nextCheckIn = dateToUTC(nextCheckInDate);
  const hoursUntilNextCheckIn = 
    (nextCheckIn.getTime() - checkOutDate.getTime()) / (1000 * 60 * 60);

  if (hoursUntilNextCheckIn <= 2) {
    return 'URGENT'; // 2小時內入住
  } else if (hoursUntilNextCheckIn <= 24) {
    return 'HIGH'; // 當天入住
  } else if (hoursUntilNextCheckIn <= 48) {
    return 'NORMAL'; // 1-2天內入住
  } else {
    return 'LOW'; // 3天後才入住
  }
}

/**
 * 自動分配清掃團隊
 */
function assignCleaningTeam(
  propertyId: number,
  teams: CleaningTeam[]
): CleaningTeam | null {
  // 找出負責該物業的團隊
  const team = teams.find(t => 
    (t.propertyIds as number[]).includes(propertyId)
  );

  return team || null;
}

/**
 * 手動觸發同步（供 API 調用）
 */
export async function triggerManualSync(): Promise<SyncStats> {
  console.log('🔧 手動觸發清掃任務同步');
  return await syncCleaningTasksFromBeds24();
}

