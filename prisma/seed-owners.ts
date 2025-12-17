import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始填充業主測試資料...');

  // 測試業主資料
  const testOwners = [
    {
      email: 'owner@innbest.ai',
      name: '張業主',
      nameEn: 'Chang Owner',
      phone: '+886912345678',
      // 這是測試用的 supabaseUserId，實際使用時需要在 Supabase 中創建對應用戶
      supabaseUserId: 'test-owner-001',
      isActive: true,
      properties: [
        {
          propertyId: 272758, // Luce 池袋
          canViewBookings: true,
          canViewRevenue: true,
          canViewStats: true,
        },
      ],
    },
  ];

  for (const ownerData of testOwners) {
    try {
      const { properties, ...ownerInfo } = ownerData;

      // Upsert Owner
      const owner = await prisma.owner.upsert({
        where: {
          email: ownerInfo.email,
        },
        update: ownerInfo,
        create: ownerInfo,
      });

      console.log(`✅ 創建/更新業主: ${owner.name} (${owner.email})`);

      // 創建物業關聯
      for (const prop of properties) {
        await prisma.ownerProperty.upsert({
          where: {
            ownerId_propertyId: {
              ownerId: owner.id,
              propertyId: prop.propertyId,
            },
          },
          update: prop,
          create: {
            ownerId: owner.id,
            ...prop,
          },
        });

        console.log(`   📍 關聯物業: Property ID ${prop.propertyId}`);
      }

      // 創建預設通知設定
      await prisma.ownerNotificationSettings.upsert({
        where: {
          ownerId: owner.id,
        },
        update: {},
        create: {
          ownerId: owner.id,
          emailOnNewBooking: true,
          emailOnCancellation: true,
          emailWeeklyReport: true,
          emailMonthlyReport: true,
        },
      });

      console.log(`   🔔 創建通知設定`);
    } catch (error) {
      console.error(`❌ 創建業主失敗:`, error);
    }
  }

  console.log('\n🎉 業主測試資料填充完成！');
  console.log('\n📝 測試帳號資訊：');
  console.log('   Email: owner@innbest.ai');
  console.log('   Name: 張業主');
  console.log('   ⚠️  注意：需要在 Supabase Auth 中創建對應的用戶帳號');
  console.log('   Supabase User ID: test-owner-001');
  console.log('   建議密碼: Owner123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

