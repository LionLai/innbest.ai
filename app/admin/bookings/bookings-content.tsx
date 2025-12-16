"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useProperties } from "@/contexts/properties-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Home,
  DollarSign,
  Filter,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Booking {
  // Beds24 原始資料（所有欄位）
  [key: string]: any;
  id: number;
  bookId?: string;
  arrival: string;
  departure: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  numAdult: number;
  numChild: number;
  status: string;
  price: number;
  roomId: number;
  propertyId: number;
  bookingTime?: string;
  channel?: string;
  
  // 本地資料對應（附加在 _local 物件中）
  _local: {
    source: 'website' | 'external';
    bookingId?: string;
    beds24BookingId?: number;
    propertyId?: number;
    roomId?: number;
    roomName?: string;
    checkIn?: Date;
    checkOut?: Date;
    nights?: number;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    adults?: number;
    children?: number;
    specialRequests?: string;
    totalAmount?: any;
    currency?: string;
    priceBreakdown?: any;
    status?: string;
    failureReason?: string;
    paymentId?: string;
    payment?: {
      id: string;
      stripePaymentIntentId: string;
      stripeCheckoutId: string;
      amount: number;
      currency: string;
      status: string;
      paidAt: Date;
      failureReason?: string;
    } | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function BookingsContent() {
  const { user, signOut, isAdmin } = useAuth();
  const { properties } = useProperties();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const [stats, setStats] = useState({
    total: 0,
    website: 0,
    external: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 篩選參數
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    propertyId: '',
    roomId: '',
    source: 'all' as 'all' | 'website' | 'external',
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 獲取訂房列表
  const fetchBookings = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      // 添加篩選參數
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.roomId) params.append('roomId', filters.roomId);
      if (filters.source && filters.source !== 'all') {
        params.append('source', filters.source);
      }

      const response = await fetch(`/api/admin/bookings?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setBookings(result.data.bookings);
        setPagination(result.data.pagination);
        if (result.data.stats) {
          setStats(result.data.stats);
        }
      } else {
        setError(result.error || '載入失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchBookings();
  }, []);

  // 處理篩選
  const handleFilter = () => {
    fetchBookings(1);
  };

  // 清除篩選
  const handleClearFilter = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      propertyId: '',
      roomId: '',
      source: 'all',
    });
    // 清除後重新載入
    setTimeout(() => fetchBookings(1), 100);
  };

  // 狀態徽章顏色
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'confirmed': { label: '已確認', variant: 'default' },
      'cancelled': { label: '已取消', variant: 'destructive' },
      'pending': { label: '待處理', variant: 'secondary' },
      'modified': { label: '已修改', variant: 'outline' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // 渠道徽章（顯示具體訂房來源）
  const getChannelBadge = (channel: string | undefined, isWebsite: boolean) => {
    if (isWebsite) {
      return (
        <Badge variant="default" className="text-xs">
          網站直訂
        </Badge>
      );
    }

    // 常見渠道映射
    const channelMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'booking': { label: 'Booking.com', variant: 'secondary' },
      'airbnb': { label: 'Airbnb', variant: 'secondary' },
      'expedia': { label: 'Expedia', variant: 'secondary' },
      'agoda': { label: 'Agoda', variant: 'secondary' },
      'hotels': { label: 'Hotels.com', variant: 'secondary' },
      'ctrip': { label: 'Ctrip', variant: 'secondary' },
      'manual': { label: '手動建立', variant: 'outline' },
      'phone': { label: '電話預訂', variant: 'outline' },
      'email': { label: 'Email預訂', variant: 'outline' },
    };

    if (channel) {
      const channelLower = channel.toLowerCase();
      const channelInfo = channelMap[channelLower] || { 
        label: channel, 
        variant: 'secondary' as const 
      };
      return <Badge variant={channelInfo.variant} className="text-xs">{channelInfo.label}</Badge>;
    }

    return (
      <Badge variant="secondary" className="text-xs">
        外部來源
      </Badge>
    );
  };

  // 獲取房產名稱
  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || `Property ${propertyId}`;
  };

  // 獲取房間名稱
  const getRoomName = (propertyId: number, roomId: number) => {
    const property = properties.find(p => p.id === propertyId);
    const room = property?.roomTypes.find(r => r.id === roomId);
    return room?.name || `Room ${roomId}`;
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                  <h1 className="text-2xl font-bold cursor-pointer hover:text-accent transition-colors">
                    <span className="text-foreground">innbest</span>
                    <span className="text-accent">.ai</span>
                  </h1>
                </Link>
                <Badge variant="secondary">訂房管理</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
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
          {/* 標題與統計 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">訂房管理</h2>
            <p className="text-muted-foreground mb-4">
              管理所有 Beds24 訂房記錄
            </p>
            {stats.total > 0 && (
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">總計</Badge>
                  <span className="font-semibold">{stats.total} 筆</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">網站訂房</Badge>
                  <span className="font-semibold text-primary">{stats.website} 筆</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">外部訂房</Badge>
                  <span className="font-semibold text-muted-foreground">{stats.external} 筆</span>
                </div>
              </div>
            )}
          </div>

          {/* 篩選區域 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                篩選條件
              </CardTitle>
              <CardDescription>
                根據日期、狀態、房產或房間篩選訂房記錄
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 入住日期 */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    入住日期（從）
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>

                {/* 退房日期 */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    入住日期（到）
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>

                {/* 狀態 */}
                <div className="space-y-2">
                  <Label>狀態</Label>
                  <Select
                    value={filters.status || undefined}
                    onValueChange={(value: string) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="所有狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有狀態</SelectItem>
                      <SelectItem value="confirmed">已確認</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                      <SelectItem value="pending">待處理</SelectItem>
                      <SelectItem value="modified">已修改</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 房產 */}
                <div className="space-y-2">
                  <Label>
                    <Home className="inline h-4 w-4 mr-1" />
                    房產
                  </Label>
                  <Select
                    value={filters.propertyId || undefined}
                    onValueChange={(value: string) => setFilters({ ...filters, propertyId: value === 'all' ? '' : value, roomId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="所有房產" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有房產</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 訂房來源 */}
                <div className="space-y-2">
                  <Label>訂房來源</Label>
                  <Select
                    value={filters.source}
                    onValueChange={(value: string) => setFilters({ ...filters, source: value as 'all' | 'website' | 'external' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="所有來源" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有來源</SelectItem>
                      <SelectItem value="website">網站訂房</SelectItem>
                      <SelectItem value="external">外部訂房</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-2 mt-4">
                <Button onClick={handleFilter} disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? '查詢中...' : '查詢'}
                </Button>
                <Button onClick={handleClearFilter} variant="outline" disabled={isLoading}>
                  清除篩選
                </Button>
                <Button onClick={() => fetchBookings(pagination.page)} variant="ghost" disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  重新整理
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 訂房列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>訂房列表</CardTitle>
                <div className="text-sm text-muted-foreground">
                  總計 {pagination.total} 筆訂房
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 mb-4 rounded-lg bg-destructive/10 text-destructive">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">載入中...</p>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">找不到符合條件的訂房記錄</p>
                  <Button onClick={handleClearFilter} variant="outline">
                    清除篩選條件
                  </Button>
                </div>
              ) : (
                <>
                  {/* 表格 */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>來源</TableHead>
                          <TableHead>訂單ID</TableHead>
                          <TableHead>房產 / 房間</TableHead>
                          <TableHead>入住日期</TableHead>
                          <TableHead>退房日期</TableHead>
                          <TableHead>客人</TableHead>
                          <TableHead>
                            <Users className="inline h-4 w-4 mr-1" />
                            人數
                          </TableHead>
                          <TableHead>
                            <DollarSign className="inline h-4 w-4 mr-1" />
                            價格
                          </TableHead>
                          <TableHead>狀態</TableHead>
                          <TableHead>建立時間</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              {getChannelBadge(
                                booking.channel,
                                booking._local.source === 'website'
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              <div>
                                <div className="font-semibold">
                                  {booking.bookId || `B24-${booking.id}`}
                                </div>
                                {booking._local.bookingId && (
                                  <div className="text-xs text-muted-foreground">
                                    本地: {booking._local.bookingId.substring(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {getPropertyName(booking.propertyId)}
                                </div>
                                <div className="text-muted-foreground">
                                  {getRoomName(booking.propertyId, booking.roomId)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{booking.arrival}</TableCell>
                            <TableCell>{booking.departure}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {booking.firstName} {booking.lastName}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {booking.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {booking.numAdult} 大 / {booking.numChild} 小
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold">
                                  ¥{booking.price?.toLocaleString() || '0'}
                                </div>
                                {booking._local.payment?.stripePaymentIntentId && (
                                  <div className="text-xs text-muted-foreground">
                                    Stripe: {booking._local.payment.stripePaymentIntentId.substring(0, 12)}...
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {getStatusBadge(booking.status)}
                                {booking._local.status && (
                                  <div className="text-xs text-muted-foreground">
                                    付款: {booking._local.status}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {booking.bookingTime ? new Date(booking.bookingTime).toLocaleString('zh-TW') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 分頁控制 */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      第 {pagination.page} 頁，共 {pagination.totalPages} 頁
                      （每頁 {pagination.pageSize} 筆）
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBookings(pagination.page - 1)}
                        disabled={!pagination.hasPrev || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        上一頁
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBookings(pagination.page + 1)}
                        disabled={!pagination.hasNext || isLoading}
                      >
                        下一頁
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

