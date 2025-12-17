/**
 * Next.js Middleware (JWT 版本)
 * 統一處理 Admin 和 Owner 的認證驗證（API + 前端頁面）
 * 
 * 使用 JWT token 進行驗證（本地驗證，極快！）
 * Token 存儲在 HttpOnly Cookie 中
 * 
 * 保護範圍：
 * - API: /api/admin/*, /api/owner/*
 * - 頁面: /admin/*, /owner/*
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 判斷是 API 請求還是頁面請求
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isOwnerRoute = pathname.startsWith('/owner') || pathname.startsWith('/api/owner');

  // 認證 API 路徑跳過驗證
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/refresh' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  // 登入頁面的特殊處理：已登入用戶重定向到 dashboard
  if (pathname === '/admin/login' || pathname === '/owner/login') {
    const token = request.cookies.get('auth_token')?.value;
    
    if (token) {
      const payload = await verifyJWT(token);
      
      // 已登入的用戶重定向到對應的 dashboard
      if (payload) {
        if (pathname === '/admin/login' && payload.role === 'admin') {
          console.log(`✅ [Middleware] Admin 已登入，重定向到 dashboard: ${payload.email}`);
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        if (pathname === '/owner/login' && payload.role === 'owner') {
          console.log(`✅ [Middleware] Owner 已登入，重定向到 dashboard: ${payload.email}`);
          return NextResponse.redirect(new URL('/owner/dashboard', request.url));
        }
      }
    }
    
    // 未登入或 token 無效，允許訪問登入頁
    return NextResponse.next();
  }

  try {
    // 從 HttpOnly Cookie 讀取 JWT token
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      console.warn(`[Middleware] 未提供 token: ${pathname}`);
      
      // API 請求返回 JSON 錯誤
      if (isApiRoute) {
        return NextResponse.json(
          {
            success: false,
            error: '未登入',
            code: 'NOT_AUTHENTICATED',
          },
          { status: 401 }
        );
      }
      
      // 頁面請求重定向到登入頁
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      if (isOwnerRoute) {
        return NextResponse.redirect(new URL('/owner/login', request.url));
      }
      
      // 不應該到達這裡，但為了 TypeScript 完整性
      return NextResponse.next();
    }

    // 驗證 JWT token（本地驗證，極快！< 5ms）
    const payload = await verifyJWT(token);

    if (!payload) {
      console.warn(`[Middleware] Token 無效或已過期: ${pathname}`);
      
      // 清除無效 cookie
      const clearCookie = (response: NextResponse) => {
        response.cookies.delete('auth_token');
        return response;
      };

      // API 請求返回 JSON 錯誤
      if (isApiRoute) {
        return clearCookie(
          NextResponse.json(
            {
              success: false,
              error: 'Token 無效或已過期',
              code: 'INVALID_TOKEN',
            },
            { status: 401 }
          )
        );
      }

      // 頁面請求重定向到登入頁
      if (isAdminRoute) {
        return clearCookie(
          NextResponse.redirect(new URL('/admin/login', request.url))
        );
      }
      if (isOwnerRoute) {
        return clearCookie(
          NextResponse.redirect(new URL('/owner/login', request.url))
        );
      }
      
      // 不應該到達這裡，但為了 TypeScript 完整性
      return NextResponse.next();
    }

    // 檢查 Admin 權限
    if (isAdminRoute) {
      if (payload.role !== 'admin') {
        console.warn(
          `[Middleware] 非管理員用戶 ${payload.email} 嘗試訪問 Admin: ${pathname}`
        );

        // API 請求返回 JSON 錯誤
        if (isApiRoute) {
          return NextResponse.json(
            {
              success: false,
              error: '需要管理員權限',
              code: 'ADMIN_REQUIRED',
            },
            { status: 403 }
          );
        }

        // 頁面請求重定向到 Owner 登入頁（或首頁）
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      console.log(`✅ [Middleware] Admin ${payload.email} 訪問: ${pathname}`);
    }

    // 檢查 Owner 權限
    if (isOwnerRoute) {
      if (payload.role !== 'owner') {
        console.warn(
          `[Middleware] 非業主用戶 ${payload.email} 嘗試訪問 Owner: ${pathname}`
        );

        // API 請求返回 JSON 錯誤
        if (isApiRoute) {
          return NextResponse.json(
            {
              success: false,
              error: '需要業主權限',
              code: 'OWNER_REQUIRED',
            },
            { status: 403 }
          );
        }

        // 頁面請求重定向到 Owner 登入頁
        return NextResponse.redirect(new URL('/owner/login', request.url));
      }

      console.log(`✅ [Middleware] Owner ${payload.email} 訪問: ${pathname}`);
    }

    // 將用戶信息添加到 request headers（供 API route 使用）
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-role', payload.role);
    
    if (payload.propertyIds && payload.propertyIds.length > 0) {
      response.headers.set('x-property-ids', JSON.stringify(payload.propertyIds));
    }

    return response;
  } catch (error) {
    console.error('[Middleware] 錯誤:', error);
    
    // API 請求返回 JSON 錯誤
    if (isApiRoute) {
      return NextResponse.json(
        {
          success: false,
          error: '系統錯誤',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }

    // 頁面請求重定向到對應登入頁
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isOwnerRoute) {
      return NextResponse.redirect(new URL('/owner/login', request.url));
    }

    // 其他錯誤返回首頁
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// 配置 middleware 匹配的路徑
export const config = {
  matcher: [
    /**
     * 保護範圍：
     * 1. Admin API 和頁面
     * 2. Owner API 和頁面
     * 
     * 排除：
     * - Next.js 內部路由 (_next)
     * - 靜態文件 (images, favicon, etc.)
     * - 登入頁面已在 middleware 中處理
     */
    '/api/admin/:path*',   // Admin API
    '/api/owner/:path*',   // Owner API
    '/admin/:path*',       // Admin 前端頁面
    '/owner/:path*',       // Owner 前端頁面
  ],
};
