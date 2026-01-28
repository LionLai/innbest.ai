# 圖片壓縮工具使用說明

## 📝 簡介

`compress-images.js` 是一個自動化圖片壓縮工具，用於優化網站圖片以提升載入速度。

## ✨ 功能特點

- ✅ 使用 Sharp 高性能壓縮引擎
- ✅ 自動壓縮 JPG/PNG 圖片（質量 80%）
- ✅ 自動生成 WebP 格式（質量 75%，節省 25-35% 體積）
- ✅ **智能跳過已壓縮圖片**（檢查 WebP 是否存在）
- ✅ 支援強制重新壓縮（`--force` 參數）
- ✅ 保持原始目錄結構
- ✅ 顯示詳細壓縮統計
- ✅ 支援批量處理

## 🚀 使用方法

### 1. 安裝依賴（首次使用）

```bash
npm install
```

如果 `npm install` 遇到問題，請手動安裝 Sharp：

```bash
npm install sharp --save
```

### 2. 執行壓縮

**正常壓縮（智能跳過已壓縮）：**
```bash
npm run images:compress
```

**強制重新壓縮所有圖片：**
```bash
npm run images:compress -- --force
```

**查看幫助信息：**
```bash
npm run images:compress -- --help
```

或直接執行：

```bash
node scripts/compress-images.js
node scripts/compress-images.js --force
node scripts/compress-images.js --help
```

### 3. 查看結果

執行後會顯示：
- 處理的圖片數量
- **跳過的圖片數量**（已有 WebP）
- 壓縮前後大小對比
- 節省的空間百分比
- WebP 文件生成數量
- 處理時間
- **節省的處理時間**（智能跳過功能）

## ⚙️ 壓縮配置

當前配置（可在 `compress-images.js` 中修改）：

```javascript
COMPRESSION_CONFIG = {
  jpeg: {
    quality: 80,        // JPEG 質量（推薦 70-85）
    progressive: true,  // 漸進式 JPEG
    mozjpeg: true,     // 使用 mozjpeg 演算法
  },
  webp: {
    quality: 75,       // WebP 質量（推薦 70-80）
    effort: 6,         // 壓縮力度 0-6（6 最佳）
  },
  maxWidth: 1920,      // 最大寬度（保持比例）
  maxHeight: 1920,     // 最大高度（保持比例）
}
```

## 🧠 智能跳過機制

### **判斷邏輯：**

```
檢查同資料夾下是否存在同名 .webp 文件
  ↓ 是
已壓縮 → ⏭️ 跳過（節省時間）
  ↓ 否
新圖片 → ✨ 執行壓縮
```

### **重新壓縮方法：**

**方法 1：** 使用 `--force` 參數
```bash
npm run images:compress -- --force
```

**方法 2：** 刪除 WebP 文件
```bash
# 刪除特定圖片的 WebP
Remove-Item "public\images\272758\1.webp"

# 刪除所有 WebP（PowerShell）
Get-ChildItem -Path "public\images" -Filter "*.webp" -Recurse | Remove-Item
```

然後重新執行壓縮即可。

---

## 📊 壓縮效果

### 預期結果

| 原始圖片 | 壓縮後 | 節省空間 | 節省時間 |
|---------|--------|---------|---------|
| 2-5 MB | 150-300 KB | ~90% | 首次：0s，後續：跳過 |
| 1-3 MB | 80-150 KB | ~90% | 首次：0s，後續：跳過 |

### WebP 優勢

- 相同質量下比 JPEG 小 25-35%
- 現代瀏覽器（Chrome、Firefox、Edge、Safari 14+）原生支援
- Next.js Image 組件自動選擇最佳格式

## 🗂️ 處理範圍

腳本會自動處理 `public/images/` 目錄下所有圖片：

```
public/images/
  ├── 272758/
  │   ├── 1.jpg          ← 壓縮
  │   ├── 1.webp         ← 新增
  │   ├── 2.jpg          ← 壓縮
  │   ├── 2.webp         ← 新增
  │   └── 570479/
  │       ├── 0.jpg      ← 壓縮
  │       ├── 0.webp     ← 新增
  │       └── ...
```

## ⚠️ 重要提醒

### 備份原始圖片

**壓縮會直接覆蓋原始 JPG/PNG 文件！**

建議在首次執行前手動備份：

```bash
# Windows PowerShell
Copy-Item -Recurse "public\images" "public\images-backup"

# macOS/Linux
cp -r public/images public/images-backup
```

### WebP 瀏覽器支援

| 瀏覽器 | 支援版本 |
|--------|---------|
| Chrome | 23+ ✅ |
| Firefox | 65+ ✅ |
| Edge | 18+ ✅ |
| Safari | 14+ ✅ |
| IE | ❌ 不支援 |

對於不支援的瀏覽器，Next.js Image 會自動回退到 JPG。

## 🔧 進階使用

### 只壓縮特定目錄

修改 `compress-images.js` 中的 `IMAGES_DIR` 變數：

```javascript
const IMAGES_DIR = path.join(__dirname, '../public/images/272758');
```

### 調整壓縮質量

編輯 `COMPRESSION_CONFIG` 對象：

```javascript
// 更高質量（文件較大）
jpeg: { quality: 90, ... }
webp: { quality: 85, ... }

// 更激進壓縮（文件更小）
jpeg: { quality: 70, ... }
webp: { quality: 65, ... }
```

### 限制最大尺寸

```javascript
// 適合移動端
maxWidth: 1200,
maxHeight: 1200,

// 適合桌面端
maxWidth: 2560,
maxHeight: 2560,
```

## 🛠️ 故障排除

### Sharp 安裝失敗

**Windows 用戶**：
```bash
npm install --platform=win32 --arch=x64 sharp
```

**使用 Yarn**：
```bash
yarn add sharp
```

**使用 pnpm**：
```bash
pnpm add sharp
```

### 權限錯誤

確保對 `public/images/` 目錄有寫入權限。

### 記憶體不足

處理大量圖片時可能需要增加 Node.js 記憶體限制：

```bash
node --max-old-space-size=4096 scripts/compress-images.js
```

## 📈 性能建議

1. **首次壓縮**：處理所有圖片可能需要 1-5 分鐘
2. **增量更新**：只會重新生成過期的 WebP 文件
3. **部署前執行**：建議在 git commit 前先壓縮圖片
4. **CI/CD 整合**：可加入部署流程自動化

## 🔗 相關工具

- [Sharp 官方文檔](https://sharp.pixelplumbing.com/)
- [WebP 格式介紹](https://developers.google.com/speed/webp)
- [Next.js Image 優化](https://nextjs.org/docs/app/building-your-application/optimizing/images)

## 💡 與 generate-images-config.js 的關係

這兩個腳本是**獨立的**：

1. **compress-images.js**：壓縮圖片文件
2. **generate-images-config.js**：生成圖片配置 JSON

建議執行順序：

```bash
# 1. 先壓縮圖片
npm run images:compress

# 2. 再生成配置
npm run images:generate
```

## 📞 支援

如有問題，請檢查：
1. Node.js 版本 >= 16
2. Sharp 是否正確安裝：`npm list sharp`
3. 圖片目錄路徑是否正確

---

**最後更新**：2026-01-28
