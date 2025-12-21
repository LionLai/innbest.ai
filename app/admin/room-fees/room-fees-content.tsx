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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  DollarSign,
  Home,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface RoomFee {
  id: string;
  propertyId: number;
  roomId: number;
  feeName: string;
  feeNameEn: string | null;
  amount: string;
  currency: string;
  isActive: boolean;
  displayOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function RoomFeesContent() {
  const { user, signOut, isAdmin } = useAuth();
  const { properties } = useProperties();
  
  const [fees, setFees] = useState<RoomFee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 篩選參數
  const [filters, setFilters] = useState({
    propertyId: '',
    roomId: '',
    isActive: 'all' as 'all' | 'true' | 'false',
  });
  
  // 對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentFee, setCurrentFee] = useState<RoomFee | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    propertyId: '',
    roomId: '',
    feeName: '',
    feeNameEn: '',
    amount: '',
    currency: 'JPY',
    isActive: true,
    displayOrder: '0',
    description: '',
  });
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  // 獲取費用列表
  const fetchFees = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.roomId) params.append('roomId', filters.roomId);
      if (filters.isActive !== 'all') params.append('isActive', filters.isActive);
      
      const response = await fetch(`/api/admin/room-fees?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setFees(result.data.fees);
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
    fetchFees();
  }, []);
  
  // 打開新增對話框
  const handleAdd = () => {
    setDialogMode('add');
    setFormData({
      propertyId: filters.propertyId || '',
      roomId: filters.roomId || '',
      feeName: '',
      feeNameEn: '',
      amount: '',
      currency: 'JPY',
      isActive: true,
      displayOrder: '0',
      description: '',
    });
    setDialogOpen(true);
  };
  
  // 打開編輯對話框
  const handleEdit = (fee: RoomFee) => {
    setDialogMode('edit');
    setCurrentFee(fee);
    setFormData({
      propertyId: fee.propertyId.toString(),
      roomId: fee.roomId.toString(),
      feeName: fee.feeName,
      feeNameEn: fee.feeNameEn || '',
      amount: fee.amount,
      currency: fee.currency,
      isActive: fee.isActive,
      displayOrder: fee.displayOrder.toString(),
      description: fee.description || '',
    });
    setDialogOpen(true);
  };
  
  // 保存費用
  const handleSave = async () => {
    try {
      const url = dialogMode === 'add' 
        ? '/api/admin/room-fees'
        : `/api/admin/room-fees/${currentFee?.id}`;
      
      const method = dialogMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: parseInt(formData.propertyId),
          roomId: parseInt(formData.roomId),
          feeName: formData.feeName,
          feeNameEn: formData.feeNameEn || null,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          isActive: formData.isActive,
          displayOrder: parseInt(formData.displayOrder),
          description: formData.description || null,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(dialogMode === 'add' ? '費用已新增' : '費用已更新');
        setDialogOpen(false);
        fetchFees();
      } else {
        toast.error(`錯誤：${result.error}`);
      }
    } catch (err) {
      toast.error('網路錯誤，請稍後再試');
      console.error(err);
    }
  };
  
  // 刪除費用
  const handleDelete = async (fee: RoomFee) => {
    if (!confirm(`確定要刪除「${fee.feeName}」嗎？`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/room-fees/${fee.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('費用已刪除');
        fetchFees();
      } else {
        toast.error(`錯誤：${result.error}`);
      }
    } catch (err) {
      toast.error('網路錯誤，請稍後再試');
      console.error(err);
    }
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
  
  // 獲取房間列表（根據選中的房產）
  const getRooms = () => {
    if (!formData.propertyId) return [];
    const property = properties.find(p => p.id === parseInt(formData.propertyId));
    return property?.roomTypes || [];
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
                <Badge variant="secondary">雜項費用管理</Badge>
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
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          {/* 標題 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">雜項費用管理</h2>
            <p className="text-muted-foreground">
              管理每個房間的額外費用（清潔費、住宿稅等）
            </p>
          </div>
          
          {/* 操作與篩選 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>篩選條件</CardTitle>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  新增雜項費用
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 房產篩選 */}
                <div className="space-y-2">
                  <Label>
                    <Home className="inline h-4 w-4 mr-1" />
                    房產
                  </Label>
                  <Select
                    value={filters.propertyId || undefined}
                    onValueChange={(value) => setFilters({ ...filters, propertyId: value === 'all' ? '' : value, roomId: '' })}
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
                
                {/* 狀態篩選 */}
                <div className="space-y-2">
                  <Label>狀態</Label>
                  <Select
                    value={filters.isActive}
                    onValueChange={(value) => setFilters({ ...filters, isActive: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="所有狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有狀態</SelectItem>
                      <SelectItem value="true">啟用</SelectItem>
                      <SelectItem value="false">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={fetchFees} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? '載入中...' : '重新整理'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 費用列表 */}
          <Card>
            <CardHeader>
              <CardTitle>費用列表</CardTitle>
              <CardDescription>總計 {fees.length} 筆費用</CardDescription>
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
              ) : fees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">找不到符合條件的費用記錄</p>
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增第一筆費用
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>房產 / 房間</TableHead>
                        <TableHead>費用名稱</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead>順序</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {getPropertyName(fee.propertyId)}
                              </div>
                              <div className="text-muted-foreground">
                                {getRoomName(fee.propertyId, fee.roomId)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{fee.feeName}</div>
                              {fee.feeNameEn && (
                                <div className="text-muted-foreground">{fee.feeNameEn}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {Number(fee.amount).toLocaleString()}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {fee.currency}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{fee.displayOrder}</Badge>
                          </TableCell>
                          <TableCell>
                            {fee.isActive ? (
                              <Badge variant="default">啟用</Badge>
                            ) : (
                              <Badge variant="secondary">停用</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(fee)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(fee)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? '新增雜項費用' : '編輯雜項費用'}
            </DialogTitle>
            <DialogDescription>
              為特定房間設定額外收費項目
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* 房產選擇 */}
            <div className="space-y-2">
              <Label htmlFor="propertyId">房產 *</Label>
              <Select
                value={formData.propertyId || undefined}
                onValueChange={(value) => setFormData({ ...formData, propertyId: value, roomId: '' })}
                disabled={dialogMode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇房產" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 房間選擇 */}
            <div className="space-y-2">
              <Label htmlFor="roomId">房間 *</Label>
              <Select
                value={formData.roomId || undefined}
                onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                disabled={!formData.propertyId || dialogMode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇房間" />
                </SelectTrigger>
                <SelectContent>
                  {getRooms().map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 費用名稱 */}
            <div className="space-y-2">
              <Label htmlFor="feeName">費用名稱（中文）*</Label>
              <Input
                id="feeName"
                value={formData.feeName}
                onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                placeholder="例如：清潔費"
              />
            </div>
            
            {/* 費用名稱（英文） */}
            <div className="space-y-2">
              <Label htmlFor="feeNameEn">費用名稱（英文）</Label>
              <Input
                id="feeNameEn"
                value={formData.feeNameEn}
                onChange={(e) => setFormData({ ...formData, feeNameEn: e.target.value })}
                placeholder="例如：Cleaning Fee"
              />
            </div>
            
            {/* 金額 */}
            <div className="space-y-2">
              <Label htmlFor="amount">金額 *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="5000"
              />
            </div>
            
            {/* 幣別 */}
            <div className="space-y-2">
              <Label htmlFor="currency">幣別</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JPY">JPY (日圓)</SelectItem>
                  <SelectItem value="TWD">TWD (台幣)</SelectItem>
                  <SelectItem value="USD">USD (美元)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 顯示順序 */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder">顯示順序</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
              />
            </div>
            
            {/* 狀態 */}
            <div className="space-y-2">
              <Label>狀態</Label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm">啟用</label>
              </div>
            </div>
            
            {/* 內部備註 */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">內部備註</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="例如：每次入住收取"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

