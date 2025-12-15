'use client';

import { useEffect, useState } from 'react';

/**
 * Session 初始化器
 * 在客戶端載入時自動初始化 session（設置 HTTP-only cookie）
 */
export function SessionInitializer() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include', // 確保 cookie 被發送
        });

        if (!mounted) return;

        if (response.ok) {
          console.log('✅ Session 已初始化');
          setStatus('success');
        } else {
          console.error('❌ Session 初始化失敗');
          setStatus('error');
        }
      } catch (error) {
        if (!mounted) return;
        console.error('❌ Session 初始化錯誤:', error);
        setStatus('error');
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  // 可選：顯示載入狀態
  if (status === 'loading') {
    return null; // 或顯示載入指示器
  }

  if (status === 'error') {
    return null; // 或顯示錯誤訊息
  }

  return null; // Session 初始化成功，不顯示任何內容
}

