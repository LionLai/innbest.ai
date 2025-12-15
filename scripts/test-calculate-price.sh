#!/bin/bash

# 價格計算 API 測試腳本

BASE_URL="http://localhost:3000"
API_PATH="/api/bookings/calculate-price"

echo "🧪 測試價格計算 API"
echo "===================="
echo ""

# 測試 1: 正常請求
echo "✅ 測試 1: 正常請求"
curl -X POST "${BASE_URL}${API_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 123456,
    "propertyId": 789,
    "startDate": "2025-02-01",
    "endDate": "2025-02-04"
  }' | jq
echo ""
echo ""

# 測試 2: 日期格式錯誤
echo "❌ 測試 2: 日期格式錯誤"
curl -X POST "${BASE_URL}${API_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 123456,
    "propertyId": 789,
    "startDate": "2025/02/01",
    "endDate": "2025-02-04"
  }' | jq
echo ""
echo ""

# 測試 3: 日期倒置
echo "❌ 測試 3: 日期倒置"
curl -X POST "${BASE_URL}${API_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 123456,
    "propertyId": 789,
    "startDate": "2025-02-04",
    "endDate": "2025-02-01"
  }' | jq
echo ""
echo ""

# 測試 4: 過去日期
echo "❌ 測試 4: 過去日期"
curl -X POST "${BASE_URL}${API_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 123456,
    "propertyId": 789,
    "startDate": "2020-01-01",
    "endDate": "2020-01-04"
  }' | jq
echo ""
echo ""

# 測試 5: 無效 ID
echo "❌ 測試 5: 無效 ID"
curl -X POST "${BASE_URL}${API_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": -1,
    "propertyId": 789,
    "startDate": "2025-02-01",
    "endDate": "2025-02-04"
  }' | jq
echo ""
echo ""

echo "===================="
echo "✅ 測試完成"

