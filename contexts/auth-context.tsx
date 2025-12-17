"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

// 簡化的用戶接口
interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'guest';
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 檢查用戶是否為 admin
  const isAdmin = user?.role === 'admin' || false;

  // 初始化：檢查用戶是否已登入
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 嘗試調用一個受保護的 API 來驗證 token
        const response = await fetch('/api/admin/owners');
        
        if (response.ok) {
          // Token 有效，從 response headers 或其他方式獲取用戶信息
          // 這裡簡化處理：假設已登入
          // 實際可以添加一個 /api/auth/me endpoint 來獲取用戶信息
          setUser({
            id: '',
            email: '',
            role: 'admin', // 從 API 獲取
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 設置自動刷新 token（每 23 小時）
    const refreshInterval = setInterval(async () => {
      await refreshToken();
    }, 23 * 60 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // 登入函數
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
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
        return { error: data.error || '登入失敗' };
      }

      // 設置用戶信息
      setUser(data.user);
      console.log('✅ [AuthContext] 登入成功:', data.user.email);

      return { error: null };
    } catch (error) {
      console.error('[AuthContext] 登入錯誤:', error);
      return { error: '系統錯誤' };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出函數
  const signOut = async () => {
    try {
      setIsLoading(true);

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // 清除本地狀態
      setUser(null);

      // 導航到登入頁面
      router.push('/admin/login');
      
      console.log('✅ [AuthContext] 登出成功');
    } catch (error) {
      console.error('[AuthContext] 登出錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新 token
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ [AuthContext] Token 已刷新');
      } else {
        console.warn('[AuthContext] Token 刷新失敗');
        // Token 刷新失敗，可能需要重新登入
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Token 刷新錯誤:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAdmin,
    signIn,
    signOut,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定義 Hook 用於使用 AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

