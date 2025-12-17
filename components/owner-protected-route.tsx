"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOwnerAuth } from '@/contexts/owner-auth-context';

interface OwnerProtectedRouteProps {
  children: React.ReactNode;
  requireProperty?: number; // 可選：需要訪問特定物業的權限
}

export function OwnerProtectedRoute({ 
  children, 
  requireProperty 
}: OwnerProtectedRouteProps) {
  const { user, owner, loading } = useOwnerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 未登入 -> 重定向到登入頁
      if (!user) {
        router.push('/owner/login');
        return;
      }

      // 沒有業主資料 -> 顯示錯誤
      if (!owner) {
        router.push('/owner/login?error=no_owner_data');
        return;
      }

      // 需要特定物業權限但沒有 -> 重定向
      if (requireProperty) {
        const hasAccess = owner.properties.some(
          (p) => p.propertyId === requireProperty
        );
        
        if (!hasAccess) {
          router.push('/owner/dashboard?error=no_access');
          return;
        }
      }
    }
  }, [user, owner, loading, requireProperty, router]);

  // Loading 狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // 未認證或無權限
  if (!user || !owner) {
    return null;
  }

  // 已認證且有權限
  return <>{children}</>;
}

