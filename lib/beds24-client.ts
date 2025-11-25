import { createBeds24Client } from '@lionlai/beds24-v2-sdk';

// 創建 Beds24 API 客戶端實例
// 在伺服器端使用，請勿在客戶端暴露
export const beds24Client = createBeds24Client({
  token: process.env.BEDS24_TOKEN,
  organization: process.env.BEDS24_ORGANIZATION,
});

// 驗證環境變數是否已設定
if (!process.env.BEDS24_TOKEN) {
  console.warn('⚠️  BEDS24_TOKEN 未設定，請在 .env.local 中配置');
}

if (!process.env.BEDS24_ORGANIZATION) {
  console.warn('⚠️  BEDS24_ORGANIZATION 未設定，請在 .env.local 中配置');
}

