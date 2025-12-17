"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 簡化的用戶接口（from JWT payload）
interface User {
  id: string;
  email: string;
  role: 'owner';
  propertyIds?: number[];
}

interface OwnerProperty {
  propertyId: number;
  propertyName?: string;  // 物業名稱（從 Beds24 獲取）
  canViewBookings: boolean;
  canViewRevenue: boolean;
  canViewStats: boolean;
}

interface Owner {
  id: string;
  email: string;
  name: string;
  nameEn?: string | null;
  phone?: string | null;
  lastLoginAt?: Date | null;
  properties: OwnerProperty[];
}

interface OwnerAuthContextType {
  user: User | null;
  owner: Owner | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshOwnerData: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const OwnerAuthContext = createContext<OwnerAuthContextType | undefined>(undefined);

export function OwnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 從 API 獲取業主資料
  const fetchOwnerData = async () => {
    try {
      const response = await fetch('/api/owner/session', {
        credentials: 'include', // 攜帶 HttpOnly Cookie
      });
      
      const result = await response.json();

      if (result.success && result.data?.owner) {
        setOwner(result.data.owner);
        
        // 從 API 返回的 owner 資料設置 user
        setUser({
          id: result.data.owner.id,
          email: result.data.owner.email,
          role: 'owner',
          propertyIds: result.data.owner.properties?.map((p: OwnerProperty) => p.propertyId),
        });
      } else {
        console.warn('[OwnerAuthContext] 無法獲取業主資料:', result.error);
        setOwner(null);
        setUser(null);
      }
    } catch (error) {
      console.error('[OwnerAuthContext] 獲取業主資料失敗:', error);
      setOwner(null);
      setUser(null);
    }
  };

  // 初始化：檢查當前登入狀態
  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchOwnerData();
      } catch (error) {
        console.error('[OwnerAuthContext] 初始化認證失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 設置自動刷新 token（每 23 小時）
    const refreshInterval = setInterval(async () => {
      await refreshToken();
    }, 23 * 60 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // 登入
  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 重要：攜帶 cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '登入失敗');
      }

      // 檢查是否為業主角色
      if (data.user.role !== 'owner') {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        throw new Error('您沒有業主權限');
      }

      // 獲取完整業主資料
      await fetchOwnerData();
      
      console.log('✅ [OwnerAuthContext] 登入成功:', data.user.email);
    } catch (error) {
      console.error('[OwnerAuthContext] 登入錯誤:', error);
      throw error;
    }
  };

  // 登出
  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      setOwner(null);
      router.push('/owner/login');
      
      console.log('✅ [OwnerAuthContext] 登出成功');
    } catch (error) {
      console.error('[OwnerAuthContext] 登出錯誤:', error);
    }
  };

  // 手動刷新業主資料
  const refreshOwnerData = async () => {
    await fetchOwnerData();
  };

  // 刷新 token
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ [OwnerAuthContext] Token 已刷新');
      } else {
        console.warn('[OwnerAuthContext] Token 刷新失敗');
        setUser(null);
        setOwner(null);
      }
    } catch (error) {
      console.error('[OwnerAuthContext] Token 刷新錯誤:', error);
    }
  };

  return (
    <OwnerAuthContext.Provider
      value={{
        user,
        owner,
        loading,
        signIn,
        signOut,
        refreshOwnerData,
        refreshToken,
      }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const context = useContext(OwnerAuthContext);
  if (context === undefined) {
    throw new Error('useOwnerAuth must be used within an OwnerAuthProvider');
  }
  return context;
}

