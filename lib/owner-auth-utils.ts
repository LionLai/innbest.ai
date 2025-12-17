import { User } from '@supabase/supabase-js';
import { prisma } from './prisma';

/**
 * 從 Supabase User 取得對應的 Owner 資料
 */
export async function getOwnerFromUser(user: User) {
  if (!user?.id) {
    return null;
  }

  try {
    const owner = await prisma.owner.findUnique({
      where: {
        supabaseUserId: user.id,
        isActive: true,
      },
      include: {
        properties: {
          where: {
            canViewStats: true, // 只包含有查看權限的物業
          },
          orderBy: {
            propertyId: 'asc',
          },
        },
      },
    });

    if (!owner) {
      return null;
    }

    // 更新最後登入時間
    await prisma.owner.update({
      where: { id: owner.id },
      data: { lastLoginAt: new Date() },
    });

    return owner;
  } catch (error) {
    console.error('[getOwnerFromUser] 錯誤:', error);
    return null;
  }
}

/**
 * 檢查業主是否有權限訪問指定物業
 */
export function canAccessProperty(
  owner: Awaited<ReturnType<typeof getOwnerFromUser>>,
  propertyId: number
): boolean {
  if (!owner) return false;
  return owner.properties.some((p) => p.propertyId === propertyId);
}

/**
 * 取得業主可訪問的所有物業 ID
 */
export function getOwnerPropertyIds(
  owner: Awaited<ReturnType<typeof getOwnerFromUser>>
): number[] {
  if (!owner) return [];
  return owner.properties.map((p) => p.propertyId);
}

/**
 * 檢查用戶是否為業主角色
 */
export function isOwner(user: User | null): boolean {
  if (!user) return false;
  const role = user.user_metadata?.role;
  return role === 'owner';
}

