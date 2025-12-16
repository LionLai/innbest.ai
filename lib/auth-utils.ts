import { EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'beds24_session';

// A256GCM 要求剛好 256 bits (32 bytes)
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET || 'dev-secret-32-bytes-long-key!'; // 剛好 32 字元
  const encoded = new TextEncoder().encode(secret);
  
  if (encoded.length !== 32) {
    console.warn(`⚠️  JWT_SECRET 長度應為 32 字元，目前為 ${encoded.length}。使用預設密鑰。`);
    return new TextEncoder().encode('dev-secret-32-bytes-long-key!');
  }
  
  return encoded;
};

const JWT_SECRET = getJWTSecret();

/**
 * Token 會話數據結構
 */
interface SessionData {
  beds24Token: string;
  organization?: string;  // 可選，某些 token 可能不需要
  createdAt: number;
  [key: string]: unknown; // 符合 JWTPayload 要求
}

/**
 * 使用 refresh token 從 Beds24 獲取新的 access token
 */
export async function refreshBeds24Token(refreshToken: string): Promise<string> {
  console.log('🔄 正在使用 refresh token 獲取新的 access token...');
  
  // 使用正確的 Beds24 API URL（beds24.com 而不是 api.beds24.com）
  const response = await fetch('https://beds24.com/api/v2/authentication/token', {
    method: 'GET',
    headers: {
      'refreshToken': refreshToken,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Token 刷新失敗:', response.status, errorText);
    throw new Error(`Token 刷新失敗: ${response.status}`);
  }

  const data = await response.json();
  const newToken = data.token;

  if (!newToken) {
    console.error('❌ API 回應中沒有 token');
    throw new Error('API 回應中沒有 token');
  }

  console.log('✅ Token 刷新成功！');
  return newToken;
}

/**
 * 創建加密的 session JWT 並設置為 HTTP-only cookie
 */
export async function createSession(beds24Token: string, organization?: string): Promise<void> {
  const sessionData: SessionData = {
    beds24Token,
    ...(organization && { organization }),  // 只在有值時才加入
    createdAt: Date.now(),
  };

  // 使用 JWE 加密整個 payload
  const jwt = await new EncryptJWT(sessionData)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('12h') // 12 小時有效期
    .encrypt(JWT_SECRET);

  // 設置 HTTP-only cookie
  (await cookies()).set(COOKIE_NAME, jwt, {
    httpOnly: true,    // JavaScript 無法訪問
    secure: process.env.NODE_ENV === 'production', // 生產環境只在 HTTPS
    sameSite: 'strict', // 防 CSRF
    maxAge: 60 * 60 * 12, // 12 小時（秒）
    path: '/',
  });

  console.log('🍪 Session cookie 已設置 (HTTP-only, 有效期 12 小時)');
}

/**
 * 從 cookie 中獲取並解密 session 數據
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      console.log('⚠️  沒有 session cookie');
      return null;
    }

    // 解密 JWE
    const { payload } = await jwtDecrypt(sessionCookie.value, JWT_SECRET);

    return payload as unknown as SessionData;
  } catch (error) {
    console.error('❌ 解密 session 失敗:', error);
    return null;
  }
}

/**
 * 清除 session cookie
 */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
  console.log('🗑️  Session cookie 已清除');
}

// 防止重複刷新的鎖
let refreshPromise: Promise<{ token: string; organization?: string } | null> | null = null;

/**
 * 獲取有效的 Beds24 token（從 cookie 或刷新）
 * 使用鎖機制防止同時多次刷新
 */
export async function getValidBeds24Token(): Promise<{
  token: string;
  organization?: string;
} | null> {
  // 先嘗試從 session cookie 獲取
  const session = await getSession();
  
  if (session) {
    // 檢查是否接近過期（30 分鐘內）
    const age = Date.now() - session.createdAt;
    const thirtyMinutes = 30 * 60 * 1000;
    const twelveHours = 12 * 60 * 60 * 1000;
    
    if (age < twelveHours - thirtyMinutes) {
      console.log('✅ 使用 session cookie 中的 token');
      return {
        token: session.beds24Token,
        ...(session.organization && { organization: session.organization }),
      };
    } else {
      console.log('⏰ Session 即將過期，需要刷新...');
    }
  }

  // 如果已經有刷新在進行中，等待它完成
  if (refreshPromise) {
    console.log('⏳ 等待現有的 token 刷新完成...');
    return refreshPromise;
  }

  // 開始新的刷新流程
  refreshPromise = (async () => {
    try {
      const refreshToken = process.env.BEDS24_RETOKEN;
      const organization = process.env.BEDS24_ORGANIZATION;

      if (!refreshToken) {
        console.error('❌ 缺少 BEDS24_RETOKEN');
        return null;
      }

      const newToken = await refreshBeds24Token(refreshToken);
      await createSession(newToken, organization);
      
      const result: { token: string; organization?: string } = {
        token: newToken,
      };
      
      if (organization) {
        result.organization = organization;
      }
      
      return result;
    } catch (error) {
      console.error('❌ 刷新 token 失敗:', error);
      return null;
    } finally {
      // 刷新完成，清除鎖
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

