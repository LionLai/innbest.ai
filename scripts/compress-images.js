/**
 * 圖片壓縮工具
 * 
 * 使用方法：
 * node scripts/compress-images.js [選項]
 * 
 * 選項：
 *   --force    強制重新壓縮所有圖片（即使 WebP 已存在）
 *   --help     顯示幫助信息
 * 
 * 這個腳本會：
 * 1. 掃描 public/images 目錄下的所有圖片
 * 2. 檢查是否已有 WebP 文件（若有則跳過）
 * 3. 使用 Sharp 壓縮圖片（質量 80%）
 * 4. 生成 WebP 格式（質量 75%）
 * 5. 直接覆蓋原始 JPG 文件
 * 6. 顯示壓縮統計資訊
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '../public/images');

// 解析命令行參數
const args = process.argv.slice(2);
const FORCE_COMPRESS = args.includes('--force');
const SHOW_HELP = args.includes('--help');

// 顯示幫助信息
if (SHOW_HELP) {
  console.log(`
📖 圖片壓縮工具使用說明

用法：
  node scripts/compress-images.js [選項]
  npm run images:compress [-- 選項]

選項：
  --force    強制重新壓縮所有圖片（即使 WebP 已存在）
  --help     顯示此幫助信息

範例：
  # 正常壓縮（跳過已有 WebP 的圖片）
  npm run images:compress

  # 強制重新壓縮所有圖片
  npm run images:compress -- --force

智能跳過機制：
  - 如果圖片已有對應的 .webp 文件，視為已壓縮，自動跳過
  - 如果想重新壓縮，使用 --force 參數
  - 或手動刪除 .webp 文件後重新執行
`);
  process.exit(0);
}

// 壓縮配置
const COMPRESSION_CONFIG = {
  jpeg: {
    quality: 80,
    progressive: true,
    mozjpeg: true, // 使用 mozjpeg 演算法獲得更好的壓縮
  },
  webp: {
    quality: 75,
    effort: 6, // 0-6, 6 為最佳壓縮（較慢但更小）
  },
  // 最大寬度限制（保持比例）
  maxWidth: 1920,
  maxHeight: 1920,
};

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 獲取文件大小
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

/**
 * 壓縮單個圖片
 */
async function compressImage(inputPath, stats) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    const webpPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const relativePath = path.relative(IMAGES_DIR, inputPath);

    // 🔍 檢查是否已壓縮（WebP 文件是否存在）
    const webpExists = fs.existsSync(webpPath);
    
    if (webpExists && !FORCE_COMPRESS) {
      // 已有 WebP 文件，跳過壓縮
      stats.skippedCount++;
      stats.totalCount++;
      console.log(`  ⏭️  ${relativePath} (已壓縮，跳過)`);
      return;
    }

    // 顯示壓縮狀態
    if (FORCE_COMPRESS && webpExists) {
      console.log(`  🔄 ${relativePath} (強制重新壓縮)`);
    } else {
      console.log(`  ✨ ${relativePath} (新圖片)`);
    }

    const originalSize = getFileSize(inputPath);
    const outputPath = inputPath; // 直接覆蓋原檔

    // 1. 壓縮並覆蓋原始 JPG/PNG
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(inputPath)
        .resize(COMPRESSION_CONFIG.maxWidth, COMPRESSION_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg(COMPRESSION_CONFIG.jpeg)
        .toFile(outputPath + '.tmp');

      // 替換原檔
      fs.renameSync(outputPath + '.tmp', outputPath);
      
      const compressedSize = getFileSize(outputPath);
      const savedSize = originalSize - compressedSize;
      const savedPercent = ((savedSize / originalSize) * 100).toFixed(1);

      stats.processedCount++;
      stats.totalCount++;
      stats.totalOriginalSize += originalSize;
      stats.totalCompressedSize += compressedSize;

      console.log(`     ${formatSize(originalSize)} → ${formatSize(compressedSize)} (節省 ${savedPercent}%)`);

    } else if (ext === '.png') {
      await sharp(inputPath)
        .resize(COMPRESSION_CONFIG.maxWidth, COMPRESSION_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(outputPath + '.tmp');

      fs.renameSync(outputPath + '.tmp', outputPath);
      
      const compressedSize = getFileSize(outputPath);
      const savedSize = originalSize - compressedSize;
      const savedPercent = ((savedSize / originalSize) * 100).toFixed(1);

      stats.processedCount++;
      stats.totalCount++;
      stats.totalOriginalSize += originalSize;
      stats.totalCompressedSize += compressedSize;

      console.log(`     ${formatSize(originalSize)} → ${formatSize(compressedSize)} (節省 ${savedPercent}%)`);
    }

    // 2. 生成 WebP 格式
    await sharp(inputPath)
        .resize(COMPRESSION_CONFIG.maxWidth, COMPRESSION_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp(COMPRESSION_CONFIG.webp)
        .toFile(webpPath + '.tmp');

      fs.renameSync(webpPath + '.tmp', webpPath);

      const webpSize = getFileSize(webpPath);
      stats.webpCount++;
      stats.totalWebpSize += webpSize;

      console.log(`     ➕ 生成 WebP: ${formatSize(webpSize)}`);

  } catch (err) {
    console.error(`  ❌ 壓縮失敗: ${path.relative(IMAGES_DIR, inputPath)}`);
    console.error(`     錯誤: ${err.message}`);
    stats.errorCount++;
  }
}

/**
 * 遞迴掃描目錄並壓縮圖片
 */
async function processDirectory(dir, stats) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath, stats);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      
      // 只處理圖片文件，跳過已經生成的 WebP
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        await compressImage(fullPath, stats);
      }
    }
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 開始壓縮圖片...\n');

  // 檢查圖片目錄是否存在
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ 圖片目錄不存在: ${IMAGES_DIR}`);
    process.exit(1);
  }

  // 檢查 Sharp 是否已安裝
  try {
    require.resolve('sharp');
  } catch (err) {
    console.error('❌ Sharp 未安裝，請先執行: npm install sharp');
    process.exit(1);
  }

  console.log('⚙️  壓縮配置:');
  console.log(`   - JPEG 質量: ${COMPRESSION_CONFIG.jpeg.quality}%`);
  console.log(`   - WebP 質量: ${COMPRESSION_CONFIG.webp.quality}%`);
  console.log(`   - 最大尺寸: ${COMPRESSION_CONFIG.maxWidth}x${COMPRESSION_CONFIG.maxHeight}`);
  console.log(`   - 智能跳過: ${FORCE_COMPRESS ? '關閉（強制重新壓縮）' : '啟用（跳過已有 WebP 的圖片）'}\n`);

  const stats = {
    totalCount: 0,
    processedCount: 0,
    skippedCount: 0,
    webpCount: 0,
    existingWebpCount: 0,
    errorCount: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalWebpSize: 0,
  };

  const startTime = Date.now();

  // 處理所有圖片
  await processDirectory(IMAGES_DIR, stats);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalSaved = stats.totalOriginalSize - stats.totalCompressedSize;
  const totalSavedPercent = stats.totalOriginalSize > 0 
    ? ((totalSaved / stats.totalOriginalSize) * 100).toFixed(1)
    : 0;

  // 顯示統計結果
  console.log('\n' + '='.repeat(60));
  console.log('📊 壓縮統計結果');
  console.log('='.repeat(60));
  console.log(`\n📁 處理的圖片:`);
  console.log(`   - 總計: ${stats.totalCount} 張`);
  console.log(`   - 成功壓縮: ${stats.processedCount} 張`);
  console.log(`   - 跳過（已壓縮）: ${stats.skippedCount} 張`);
  console.log(`   - 失敗: ${stats.errorCount} 張`);
  
  console.log(`\n🖼️  WebP 格式:`);
  console.log(`   - 新增: ${stats.webpCount} 張`);
  if (stats.skippedCount > 0) {
    console.log(`   - 已存在（跳過）: ${stats.skippedCount} 張`);
  }
  
  if (stats.processedCount > 0) {
    console.log(`\n💾 文件大小:`);
    console.log(`   - 壓縮前: ${formatSize(stats.totalOriginalSize)}`);
    console.log(`   - 壓縮後: ${formatSize(stats.totalCompressedSize)}`);
    console.log(`   - WebP 總計: ${formatSize(stats.totalWebpSize)}`);
    
    console.log(`\n💰 節省空間:`);
    console.log(`   - 節省: ${formatSize(totalSaved)} (${totalSavedPercent}%)`);
  }
  
  console.log(`\n⏱️  處理時間: ${duration} 秒`);
  
  if (stats.skippedCount > 0 && stats.processedCount > 0) {
    const timeSaved = Math.round((stats.skippedCount / stats.totalCount) * 100);
    console.log(`   💡 智能跳過節省約 ${timeSaved}% 處理時間`);
  }
  
  console.log('\n🎉 壓縮完成！');

  // 提示
  console.log('\n💡 提示:');
  if (stats.processedCount > 0) {
    console.log('   - 原始 JPG/PNG 已被壓縮版本覆蓋');
    console.log('   - WebP 文件已生成，可供現代瀏覽器使用');
  }
  if (stats.skippedCount > 0) {
    console.log('   - 已跳過有 WebP 的圖片，使用 --force 可強制重新壓縮');
  }
  console.log('   - 建議使用 Next.js <Image> 組件自動選擇最佳格式');
}

// 執行
main().catch(err => {
  console.error('❌ 執行失敗:', err);
  process.exit(1);
});
