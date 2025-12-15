/**
 * 自動生成圖片配置文件
 * 
 * 使用方法：
 * node scripts/generate-images-config.js
 * 
 * 這個腳本會掃描 public/images 目錄，
 * 自動生成 images-config.json 文件
 */

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/images');
const OUTPUT_FILE = path.join(__dirname, '../public/images/images-config.json');

// 房間名稱映射（從 Beds24 API 獲取或手動維護）
const ROOM_NAMES = {
  570479: '上池袋401',
  621929: '上池袋202',
  629760: '上池袋201',
  632393: '上池袋402',
};

// 房產名稱映射
const PROPERTY_NAMES = {
  272758: 'Luce 池袋',
};

/**
 * 掃描目錄並返回所有圖片文件
 */
function getImageFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    return files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => {
        // 按數字排序
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
  } catch (err) {
    return [];
  }
}

/**
 * 生成圖片配置對象
 */
function generateImageConfig(relativePath, alt, index) {
  return {
    path: `/images/${relativePath}`,
    alt,
    isPrimary: index === 0,
    order: index,
  };
}

/**
 * 掃描並生成配置
 */
function generateConfig() {
  const config = {
    properties: {},
  };

  // 掃描所有房產目錄
  const properties = fs.readdirSync(IMAGES_DIR)
    .filter(name => {
      const fullPath = path.join(IMAGES_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    });

  for (const propertyId of properties) {
    const propertyPath = path.join(IMAGES_DIR, propertyId);
    const propertyName = PROPERTY_NAMES[propertyId] || `Property ${propertyId}`;

    console.log(`📂 處理房產: ${propertyId} (${propertyName})`);

    const property = {
      propertyId: parseInt(propertyId),
      name: propertyName,
      images: [],
      rooms: {},
    };

    // 掃描房產級別的圖片
    const propertyImages = getImageFiles(propertyPath);
    propertyImages.forEach((file, index) => {
      property.images.push(
        generateImageConfig(
          `${propertyId}/${file}`,
          `${propertyName}${index === 0 ? '外觀' : `建築外觀 ${index}`}`,
          index
        )
      );
    });
    console.log(`  ✅ 找到 ${propertyImages.length} 張房產圖片`);

    // 掃描所有房間目錄
    const rooms = fs.readdirSync(propertyPath)
      .filter(name => {
        const fullPath = path.join(propertyPath, name);
        return fs.statSync(fullPath).isDirectory();
      });

    for (const roomId of rooms) {
      const roomPath = path.join(propertyPath, roomId);
      const roomName = ROOM_NAMES[roomId] || `Room ${roomId}`;

      console.log(`  📂 處理房間: ${roomId} (${roomName})`);

      const room = {
        roomId: parseInt(roomId),
        name: roomName,
        images: [],
      };

      // 掃描房間圖片
      const roomImages = getImageFiles(roomPath);
      roomImages.forEach((file, index) => {
        room.images.push(
          generateImageConfig(
            `${propertyId}/${roomId}/${file}`,
            index === 0 ? `${roomName} - 主圖` : `${roomName} - 圖片 ${index}`,
            index
          )
        );
      });
      console.log(`    ✅ 找到 ${roomImages.length} 張房間圖片`);

      property.rooms[roomId] = room;
    }

    config.properties[propertyId] = property;
  }

  return config;
}

/**
 * 主函數
 */
function main() {
  console.log('🚀 開始生成圖片配置...\n');

  // 檢查圖片目錄是否存在
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ 圖片目錄不存在: ${IMAGES_DIR}`);
    process.exit(1);
  }

  // 生成配置
  const config = generateConfig();

  // 寫入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(config, null, 2), 'utf8');

  console.log(`\n✅ 配置文件已生成: ${OUTPUT_FILE}`);
  console.log(`\n📊 統計資訊:`);
  console.log(`   - 房產數量: ${Object.keys(config.properties).length}`);
  
  Object.entries(config.properties).forEach(([propId, prop]) => {
    console.log(`   - ${prop.name} (${propId}):`);
    console.log(`     • 房產圖片: ${prop.images.length} 張`);
    console.log(`     • 房間數量: ${Object.keys(prop.rooms).length} 個`);
    Object.entries(prop.rooms).forEach(([roomId, room]) => {
      console.log(`       - ${room.name} (${roomId}): ${room.images.length} 張圖片`);
    });
  });

  console.log('\n🎉 完成！');
}

// 執行
main();

