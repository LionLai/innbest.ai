"use client";

import { useState, useEffect } from "react";
import { useOwnerAuth } from "@/contexts/owner-auth-context";
import { OwnerProtectedRoute } from "@/components/owner-protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  LogOut,
  TrendingUp,
  DollarSign,
  Home,
  RefreshCw,
  Calendar,
  Users,
} from "lucide-react";

interface DashboardStats {
  totalBookings: number;
  websiteBookings: number;
  externalBookings: number;
  totalRevenue: number;
  activeRooms: number;
  totalProperties: number;
  occupancyRate: number;
  growth: {
    bookings: string;
    revenue: string;
  };
}

export function OwnerDashboardContent() {
  const { owner, signOut } = useOwnerAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 獲取統計數據
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/owner/stats?period=month');
      const result = await response.json();

      if (result.success) {
        setStats(result.data.stats);
      } else {
        setError(result.error || '載入統計失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('獲取統計失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <OwnerProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header - 手機優先設計 */}
        <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  <span className="text-foreground">innbest</span>
                  <span className="text-accent">.ai</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  業主管理平台
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">登出</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  歡迎回來，{owner?.name}！
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  查看您的物業經營狀況
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={isLoading}
                className="self-start sm:self-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                重新整理
              </Button>
            </div>

            {/* 顯示關聯的物業 */}
            {owner && owner.properties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">管理物業：</span>
                {owner.properties.map((prop) => (
                  <Badge key={prop.propertyId} variant="secondary" className="text-xs">
                    <Home className="h-3 w-3 mr-1" />
                    {prop.propertyName || `Property ${prop.propertyId}`}
                  </Badge>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Stats Cards - 手機優先的 2x2 網格 */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 sm:h-10 bg-muted animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {/* 本月訂單 */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    本月訂單
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    較上月 {stats.growth.bookings}
                  </p>
                </CardContent>
              </Card>

              {/* 本月收入 */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    本月收入
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    ¥{Math.round(stats.totalRevenue / 1000)}K
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    較上月 {stats.growth.revenue}
                  </p>
                </CardContent>
              </Card>

              {/* 入住率 */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    入住率
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">{stats.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">近 30 天平均</p>
                </CardContent>
              </Card>

              {/* 活躍房源 */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    活躍房源
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">{stats.activeRooms}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalProperties} 個物業
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* 訂單來源分布 */}
          {stats && (
            <Card className="shadow-sm mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  訂單來源分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">網站直訂</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          官網訂房系統
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {stats.websiteBookings}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalBookings > 0
                          ? Math.round((stats.websiteBookings / stats.totalBookings) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-secondary rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">外部訂房</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          OTA 平台訂房
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-bold text-muted-foreground">
                        {stats.externalBookings}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalBookings > 0
                          ? Math.round((stats.externalBookings / stats.totalBookings) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 更新時間提示 */}
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>資料更新時間：{new Date().toLocaleString('zh-TW')}</p>
            <p className="mt-1">數據每 5 分鐘自動更新一次</p>
          </div>
        </div>
      </div>
    </OwnerProtectedRoute>
  );
}

