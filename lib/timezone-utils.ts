/**
 * 時區工具函數
 * 統一使用日本時區（Asia/Tokyo, JST, GMT+9）處理所有日期操作
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const TOKYO_TZ = 'Asia/Tokyo';

/**
 * 獲取日本時間的當前時間
 */
export function getNowInTokyo(): Date {
  const now = new Date();
  return toZonedTime(now, TOKYO_TZ);
}

/**
 * 獲取日本時間的今天（午夜 00:00:00 JST）
 * @returns Date 對象，表示日本時間今天的午夜
 */
export function getTodayInTokyo(): Date {
  const now = new Date();
  const tokyoNow = toZonedTime(now, TOKYO_TZ);
  
  // 設置為日本時間的午夜
  tokyoNow.setHours(0, 0, 0, 0);
  
  // 轉回 UTC 表示（內部存儲）
  return fromZonedTime(tokyoNow, TOKYO_TZ);
}

/**
 * 解析日期字符串為日本時區的 Date 對象
 * @param dateStr 日期字符串，格式：YYYY-MM-DD
 * @returns Date 對象，表示該日期在日本時區的午夜
 * 
 * @example
 * parseDateInTokyo('2025-12-22') // 返回 2025-12-22 00:00:00 JST
 */
export function parseDateInTokyo(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // 創建日本時區的日期（午夜）
  const tokyoDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // 轉換為正確的 UTC 時間戳
  return fromZonedTime(tokyoDate, TOKYO_TZ);
}

/**
 * 格式化為日本時間的日期字符串（YYYY-MM-DD）
 * @param date Date 對象
 * @returns 日期字符串，格式：YYYY-MM-DD
 */
export function formatDateInTokyo(date: Date): string {
  const tokyoDate = toZonedTime(date, TOKYO_TZ);
  const year = tokyoDate.getFullYear();
  const month = String(tokyoDate.getMonth() + 1).padStart(2, '0');
  const day = String(tokyoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化為日本時間的完整時間字符串
 * @param date Date 對象
 * @returns 時間字符串，格式：YYYY-MM-DD HH:mm:ss JST
 */
export function formatDateTimeInTokyo(date: Date): string {
  const tokyoDate = toZonedTime(date, TOKYO_TZ);
  const year = tokyoDate.getFullYear();
  const month = String(tokyoDate.getMonth() + 1).padStart(2, '0');
  const day = String(tokyoDate.getDate()).padStart(2, '0');
  const hours = String(tokyoDate.getHours()).padStart(2, '0');
  const minutes = String(tokyoDate.getMinutes()).padStart(2, '0');
  const seconds = String(tokyoDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} JST`;
}

/**
 * 檢查日期是否在日本時間的今天
 */
export function isTodayInTokyo(date: Date): boolean {
  const today = getTodayInTokyo();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return date >= today && date < tomorrow;
}

