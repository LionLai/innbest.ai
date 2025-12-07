import { createBeds24Client, createAutoRefreshClient } from '@lionlai/beds24-v2-sdk';

// 創建 Beds24 API 客戶端實例
// 在伺服器端使用，請勿在客戶端暴露
const baseClient= createBeds24Client({
  token: process.env.BEDS24_TOKEN,
  organization: process.env.BEDS24_ORGANIZATION,
});

export const beds24Client = createAutoRefreshClient(
  baseClient, 
  process.env.BEDS24_RETOKEN || '', 
  (newToken: string) => {
    // 當 Token 刷新成功時觸發，可在此儲存新 Token
    console.log('Token updated!', newToken);
  }
);

// 驗證環境變數是否已設定
if (!process.env.BEDS24_TOKEN) {
  console.warn('⚠️  BEDS24_TOKEN 未設定，請在 .env.local 中配置');
}

if (!process.env.BEDS24_ORGANIZATION) {
  console.warn('⚠️  BEDS24_ORGANIZATION 未設定，請在 .env.local 中配置');
}

if (!process.env.BEDS24_RETOKEN) {
  console.warn('⚠️  BEDS24_RETOKEN 未設定，請在 .env.local 中配置');
}

