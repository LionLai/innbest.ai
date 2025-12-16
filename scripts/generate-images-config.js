/**
 * 自動生成圖片配置文件
 * 
 * 使用方法：
 * node scripts/generate-images-config.js
 * 
 * 這個腳本會：
 * 1. 從 Beds24 API 獲取房產和房間名稱
 * 2. 掃描 public/images 目錄
 * 3. 自動生成 images-config.json 文件
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const IMAGES_DIR = path.join(__dirname, '../public/images');
const OUTPUT_FILE = path.join(__dirname, '../public/images/images-config.json');

// 備用的房間名稱映射（當 API 不可用時使用）
const FALLBACK_ROOM_NAMES = {
  570479: '上池袋401',
  621929: '上池袋202',
  629760: '上池袋201',
  632393: '上池袋402',
};

// 備用的房產名稱映射
const FALLBACK_PROPERTY_NAMES = {
  272758: 'Luce 池袋',
};

/**
 * 從 Beds24 API 獲取房產和房間資訊
 */
async function fetchBeds24Properties() {
  try {
    console.log('🔄 從 Beds24 API 獲取房產資訊...');

    const refreshToken = process.env.BEDS24_REFRESH_TOKEN || process.env.BEDS24_RETOKEN;
    
    if (!refreshToken) {
      console.warn('⚠️  未找到 BEDS24_REFRESH_TOKEN，將使用備用名稱');
      return null;
    }

    // 1. 獲取 access token
    console.log('   🔑 獲取 access token...');
    const tokenResponse = await fetch('https://beds24.com/api/v2/authentication/token', {
      method: 'GET',
      headers: {
        'refreshToken': refreshToken,
        'accept': 'application/json',
      },
    });

    if (!tokenResponse.ok) {
      console.warn('⚠️  Token 獲取失敗，將使用備用名稱');
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.token;

    if (!accessToken) {
      console.warn('⚠️  Token 無效，將使用備用名稱');
      return null;
    }

    // 2. 獲取房產資料
    console.log('   🏨 獲取房產和房間資料...');
    const propertiesResponse = await fetch('https://beds24.com/api/v2/properties?includeAllRooms=true', {
      method: 'GET',
      headers: {
        'token': accessToken,
        'accept': 'application/json',
      },
    });

    if (!propertiesResponse.ok) {
      console.warn('⚠️  房產資料獲取失敗，將使用備用名稱');
      return null;
    }

    const propertiesData = await propertiesResponse.json();
    
    // 3. 轉換為映射格式
    const propertyNames = {};
    const roomNames = {};

    if (propertiesData.data && Array.isArray(propertiesData.data)) {
      propertiesData.data.forEach(property => {
        if (property.id) {
          propertyNames[property.id] = property.name || `Property ${property.id}`;
          
          if (property.roomTypes && Array.isArray(property.roomTypes)) {
            property.roomTypes.forEach(room => {
              if (room.id) {
                roomNames[room.id] = room.name || `Room ${room.id}`;
              }
            });
          }
        }
      });

      console.log(`   ✅ 成功獲取 ${Object.keys(propertyNames).length} 個房產，${Object.keys(roomNames).length} 個房間`);
      return { propertyNames, roomNames };
    }

    console.warn('⚠️  API 返回格式異常，將使用備用名稱');
    return null;
  } catch (error) {
    console.warn('⚠️  API 調用失敗:', error.message);
    console.warn('   將使用備用名稱');
    return null;
  }
}

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
function generateConfig(propertyNames, roomNames) {
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
    const propertyName = propertyNames[propertyId] || `Property ${propertyId}`;

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
          `${propertyName}${index === 0 ? '外觀' : ` 建築外觀 ${index}`}`,
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
      const roomName = roomNames[roomId] || `Room ${roomId}`;

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
async function main() {
  console.log('🚀 開始生成圖片配置...\n');

  // 檢查圖片目錄是否存在
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ 圖片目錄不存在: ${IMAGES_DIR}`);
    process.exit(1);
  }

  // 嘗試從 Beds24 API 獲取名稱
  const apiData = await fetchBeds24Properties();
  
  // 使用 API 數據或備用數據
  const propertyNames = apiData?.propertyNames || FALLBACK_PROPERTY_NAMES;
  const roomNames = apiData?.roomNames || FALLBACK_ROOM_NAMES;

  console.log('\n📝 使用的名稱映射:');
  console.log('   房產:', Object.keys(propertyNames).length, '個');
  console.log('   房間:', Object.keys(roomNames).length, '個\n');

  // 生成配置
  const config = generateConfig(propertyNames, roomNames);

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
main().catch(err => {
  console.error('❌ 執行失敗:', err);
  process.exit(1);
});
