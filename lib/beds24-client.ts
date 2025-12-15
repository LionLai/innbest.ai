import { createBeds24Client } from '@lionlai/beds24-v2-sdk';
import { getValidBeds24Token } from './auth-utils';

// 自定義 debug middleware
const debugMiddleware = {
  async onRequest(req: Request, options: any) {
    console.log('\n🚀 ========== Beds24 API Request ==========');
    console.log('📍 URL:', req.url);
    console.log('📋 Method:', req.method);
    console.log('📦 Headers:');
    req.headers.forEach((value: string, key: string) => {
      console.log(`   ${key}: ${value}`);
    });
    
    if (options?.body) {
      console.log('📤 Request Body:', JSON.stringify(options.body, null, 2));
    }
    
    return req;
  },
  
  async onResponse(res: Response, options: any) {
    console.log('\n📥 ========== Beds24 API Response ==========');
    console.log('📊 Status:', res.status, res.statusText);
    console.log('📦 Response Headers:');
    res.headers.forEach((value: string, key: string) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // 讀取並顯示 response body
    const cloned = res.clone();
    try {
      const body = await cloned.json();
      console.log('📤 Response Body:', JSON.stringify(body, null, 2));
    } catch (e) {
      try {
        const text = await cloned.text();
        console.log('📤 Response Text:', text);
      } catch {
        console.log('📤 Response Body: (無法讀取)');
      }
    }
    console.log('==========================================\n');
    
    return res;
  }
};

// 創建無狀態的 Beds24 客戶端（SDK 0.2.0）
// 注意：使用正確的 baseUrl（beds24.com 而不是 api.beds24.com）
const beds24Client = createBeds24Client({
  baseUrl: 'https://beds24.com/api/v2',
  middleware: process.env.NODE_ENV === 'development' 
    ? [debugMiddleware]
    : [],  // 生產環境不使用 middleware
});

/**
 * 獲取請求所需的認證 headers
 * Token 從 HTTP-only cookie session 中獲取（自動刷新）
 * 
 * 工作原理：
 * 1. 檢查 session cookie 中是否有有效 token
 * 2. 如果沒有或即將過期，使用 BEDS24_RETOKEN 刷新
 * 3. 將新 token 加密存入 HTTP-only cookie
 * 4. 返回認證 headers
 * 
 * SDK 0.2.0 採用無狀態設計，需要在每次請求時傳入 token
 */
export async function getBeds24Headers(): Promise<Record<string, string>> {
  const sessionData = await getValidBeds24Token();

  if (!sessionData) {
    throw new Error('無法獲取有效的 Beds24 token，請檢查環境變數設定');
  }

  const headers: Record<string, string> = {
    token: sessionData.token,
  };
  
  // organization 是可選的，只在有值時才加入
  //if (sessionData.organization) {
    //headers.organization = sessionData.organization;
  //}
  
  console.log('🔧 [getBeds24Headers] 返回的 headers:', headers);
  console.log('   - token 類型:', typeof headers.token);
  console.log('   - token 前20字:', headers.token?.substring(0, 20));
  console.log('   - organization:', headers.organization || '(未設定)');
  
  return headers;
}

/**
 * 導出客戶端和獲取 headers 的便捷方法
 */
export { beds24Client };

// 驗證必要的環境變數
if (!process.env.BEDS24_RETOKEN) {
  console.error('❌ BEDS24_RETOKEN 未設定，這是必要的環境變數');
}

if (!process.env.BEDS24_ORGANIZATION) {
  console.warn('⚠️  BEDS24_ORGANIZATION 未設定（某些 API 可能需要）');
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET 未設定，使用開發用預設密鑰');
  console.warn('   生產環境請設定 32 字元長度的密鑰！');
  console.warn('   生成方法: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\').substring(0, 32))"');
}

