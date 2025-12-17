/**
 * JWT Token 工具函數
 * 使用 jose 庫進行 JWT 簽發和驗證
 */

import { SignJWT, jwtVerify } from 'jose';

// JWT Payload 接口
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'owner' | 'guest';
  propertyIds?: number[]; // Owner 可訪問的物業 IDs
  iat: number; // 簽發時間
  exp: number; // 過期時間
}

// JWT 配置
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production'
);
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = 24 * 60 * 60; // 24 小時（秒）

/**
 * 簽發 JWT Token
 * @param payload - Token payload（不包含 iat 和 exp）
 * @returns JWT token 字符串
 */
export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  try {
    const token = await new SignJWT({
      ...payload,
      iat: now,
      exp: now + JWT_EXPIRATION,
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt(now)
      .setExpirationTime(now + JWT_EXPIRATION)
      .sign(JWT_SECRET);

    return token;
  } catch (error) {
    console.error('[JWT] 簽發 token 失敗:', error);
    throw new Error('無法簽發 JWT token');
  }
}

/**
 * 驗證 JWT Token
 * @param token - JWT token 字符串
 * @returns Token payload 或 null（如果驗證失敗）
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as JWTPayload;
  } catch (error) {
    if (error instanceof Error) {
      // Token 過期
      if (error.name === 'JWTExpired') {
        console.warn('[JWT] Token 已過期');
        return null;
      }
      // Token 無效
      console.warn('[JWT] Token 驗證失敗:', error.message);
    }
    return null;
  }
}

/**
 * 刷新 JWT Token（重新簽發）
 * @param oldToken - 舊的 JWT token
 * @returns 新的 JWT token 或 null（如果舊 token 無效）
 */
export async function refreshJWT(oldToken: string): Promise<string | null> {
  const payload = await verifyJWT(oldToken);

  if (!payload) {
    console.warn('[JWT] 無法刷新 token - 舊 token 無效');
    return null;
  }

  // 重新簽發新 token（延長有效期）
  try {
    const newToken = await signJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      propertyIds: payload.propertyIds,
    });

    console.log(`✅ [JWT] Token 已刷新: ${payload.email}`);
    return newToken;
  } catch (error) {
    console.error('[JWT] 刷新 token 失敗:', error);
    return null;
  }
}

/**
 * 從 token 中提取 payload（不驗證簽名）
 * ⚠️ 僅用於調試，不可用於認證！
 * @param token - JWT token 字符串
 * @returns Decoded payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload as JWTPayload;
  } catch (error) {
    console.error('[JWT] 解碼失敗:', error);
    return null;
  }
}

/**
 * 檢查 token 是否即將過期（1小時內）
 * @param token - JWT token 字符串
 * @returns 是否即將過期
 */
export async function isTokenExpiringSoon(token: string): Promise<boolean> {
  const payload = await verifyJWT(token);
  if (!payload) {
    return true; // 無效 token 視為已過期
  }

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - now;

  // 如果距離過期時間少於 1 小時
  return timeUntilExpiry < 60 * 60;
}

