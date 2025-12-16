"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // 如果沒有登入，導向登入頁面
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // 如果需要 admin 權限但用戶不是 admin
      if (requireAdmin && !isAdmin) {
        router.push('/');
        return;
      }
    }
  }, [user, isAdmin, isLoading, router, requireAdmin]);

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">驗證中...</p>
        </div>
      </div>
    );
  }

  // 未登入或無權限
  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  // 已登入且有權限
  return <>{children}</>;
}

