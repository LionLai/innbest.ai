"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Home,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalBookings: number;
  websiteBookings: number;
  externalBookings: number;
  totalRevenue: number;
  activeRooms: number;
  occupancyRate: number;
  growth: {
    bookings: string;
    revenue: string;
  };
  totalProperties: number;
}

export function DashboardContent() {
  const { user, signOut, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 獲取統計數據
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/stats?period=month');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data.stats);
      } else {
        setError(result.error || '載入統計失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">
                  <span className="text-foreground">innbest</span>
                  <span className="text-accent">.ai</span>
                </h1>
                <Badge variant="secondary">管理後台</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user?.email}</p>
                  {isAdmin && (
                    <Badge variant="default" className="text-xs">
                      管理員
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">歡迎回來！</h2>
                <p className="text-muted-foreground">
                  這是您的管理控制面板，快速查看系統狀態並管理各項功能
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                重新整理
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">載入中...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    總訂單數
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    較上月 {stats.growth.bookings}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default" className="text-xs">
                      網站 {stats.websiteBookings}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      外部 {stats.externalBookings}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    總收入
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    較上月 {stats.growth.revenue}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    活躍房源
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeRooms}</div>
                  <p className="text-xs text-muted-foreground">
                    分布於 {stats.totalProperties} 個物業
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    入住率
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    近 30 天平均
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <LayoutDashboard className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>訂單管理</CardTitle>
                <CardDescription>
                  查看和管理所有訂單記錄
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/bookings">
                    前往管理
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Building2 className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>房源管理</CardTitle>
                <CardDescription>
                  管理飯店物業和房型資訊
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/properties">
                    前往管理
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>空房管理</CardTitle>
                <CardDescription>
                  查看和管理房間可用性
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/availability">
                    前往管理
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>業主管理</CardTitle>
                <CardDescription>
                  管理業主帳號和權限
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/owners">
                    前往管理
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Home className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>前台預覽</CardTitle>
                <CardDescription>
                  查看客戶端網站
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/hotels" target="_blank">
                    前往查看
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>系統設定</CardTitle>
                <CardDescription>
                  配置系統參數和選項
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/settings">
                    前往設定
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

