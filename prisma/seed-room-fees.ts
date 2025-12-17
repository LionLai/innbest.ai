import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始填充房間雜項費用資料...');
  
  // 清除現有資料（選用）
  // await prisma.roomFee.deleteMany({});
  
  // 初始費用資料
  const fees = [
    // 上池袋401
    {
      propertyId: 272758,
      roomId: 570479,
      feeName: "清潔費",
      feeNameEn: "Cleaning Fee",
      amount: 8500,
      currency: "JPY",
      isActive: true,
      displayOrder: 1,
      description: "每次入住收取",
    },
    
    // 上池袋202
    {
      propertyId: 272758,
      roomId: 621929,
      feeName: "清潔費",
      feeNameEn: "Cleaning Fee",
      amount: 9800,
      currency: "JPY",
      isActive: true,
      displayOrder: 1,
      description: "每次入住收取",
    },
    
    // 上池袋201
    {
      propertyId: 272758,
      roomId: 629760,
      feeName: "清潔費",
      feeNameEn: "Cleaning Fee",
      amount: 8500,
      currency: "JPY",
      isActive: true,
      displayOrder: 1,
      description: "每次入住收取",
    },
    
    // 上池袋402
    {
      propertyId: 272758,
      roomId: 632393,
      feeName: "清潔費",
      feeNameEn: "Cleaning Fee",
      amount: 8500,
      currency: "JPY",
      isActive: true,
      displayOrder: 1,
      description: "每次入住收取",
    }
  ];
  
  // 創建費用
  for (const fee of fees) {
    try {
      await prisma.roomFee.upsert({
        where: {
          propertyId_roomId_feeName: {
            propertyId: fee.propertyId,
            roomId: fee.roomId,
            feeName: fee.feeName,
          },
        },
        update: fee,
        create: fee,
      });
      console.log(`✅ 創建/更新費用: ${fee.feeName} - Room ${fee.roomId}`);
    } catch (error) {
      console.error(`❌ 創建費用失敗:`, error);
    }
  }
  
  console.log('🎉 房間雜項費用資料填充完成！');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

