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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  LogOut,
  UserPlus,
  Users as UsersIcon,
  Home,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

interface Owner {
  id: string;
  email: string;
  name: string;
  nameEn?: string | null;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  supabaseUserId: string;
  properties: Array<{
    propertyId: number;
  }>;
  _count?: {
    properties: number;
  };
}

export function OwnersContent() {
  const { user, signOut, isAdmin } = useAuth();
  const { properties } = useProperties();
  
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Create Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<{ email: string; password: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    nameEn: '',
    phone: '',
    password: '',
    propertyIds: [] as number[],
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 獲取業主列表
  const fetchOwners = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/owners');
      const result = await response.json();

      if (result.success) {
        setOwners(result.data.owners);
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

  // 初始載入（等待用戶認證完成後再執行）
  useEffect(() => {
    if (user && isAdmin && !hasLoadedOnce) {
      fetchOwners();
      setHasLoadedOnce(true);
    }
  }, [user?.id, isAdmin, hasLoadedOnce]);

  // 創建業主
  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // 顯示成功訊息和密碼
        setCreateSuccess(result.data.credentials);
        
        // 重新載入列表
        await fetchOwners();
        
        // 重置表單
        setFormData({
          email: '',
          name: '',
          nameEn: '',
          phone: '',
          password: '',
          propertyIds: [],
        });
      } else {
        setError(result.error || '創建失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // 處理物業選擇
  const toggleProperty = (propertyId: number) => {
    setFormData(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.includes(propertyId)
        ? prev.propertyIds.filter(id => id !== propertyId)
        : [...prev.propertyIds, propertyId],
    }));
  };

  // 生成隨機密碼
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
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
                <Badge variant="secondary">業主管理</Badge>
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
          {/* 標題與操作 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">業主管理</h2>
                <p className="text-muted-foreground">
                  管理所有業主帳號和權限
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOwners}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  重新整理
                </Button>
                <Button
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                    setCreateSuccess(null);
                    setError(null);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  新增業主
                </Button>
              </div>
            </div>

            {owners.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">總計</Badge>
                <span className="font-semibold">{owners.length} 位業主</span>
              </div>
            )}
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive">
              {error}
            </div>
          )}

          {/* 業主列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                業主列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">載入中...</p>
                  </div>
                </div>
              ) : owners.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">尚無業主資料</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    新增第一位業主
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>電話</TableHead>
                        <TableHead>關聯物業</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>最後登入</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owners.map((owner) => (
                        <TableRow key={owner.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{owner.name}</div>
                              {owner.nameEn && (
                                <div className="text-xs text-muted-foreground">
                                  {owner.nameEn}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{owner.email}</TableCell>
                          <TableCell>{owner.phone || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {owner.properties.map((prop) => (
                                <Badge key={prop.propertyId} variant="secondary" className="text-xs">
                                  <Home className="h-3 w-3 mr-1" />
                                  {prop.propertyId}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {owner.isActive ? (
                              <Badge variant="default" className="text-xs">啟用中</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">已停用</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {owner.lastLoginAt
                              ? new Date(owner.lastLoginAt).toLocaleDateString('zh-TW')
                              : '未登入'}
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

      {/* 創建業主 Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增業主</DialogTitle>
            <DialogDescription>
              {createSuccess
                ? '業主創建成功！請妥善保管以下登入資訊。'
                : '創建新業主帳號，系統將自動設置 Supabase 用戶。'}
            </DialogDescription>
          </DialogHeader>

          {createSuccess ? (
            /* 成功訊息 */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">✅ 業主創建成功！</h4>
                <p className="text-sm text-green-700 mb-4">
                  請將以下登入資訊提供給業主，密碼只顯示一次。
                </p>
                <div className="space-y-2 bg-white p-4 rounded border">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-mono text-sm">{createSuccess.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">密碼</Label>
                    <p className="font-mono text-sm font-bold">{createSuccess.password}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">登入網址</Label>
                    <p className="font-mono text-sm text-primary">
                      {window.location.origin}/owner/login
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setCreateSuccess(null);
                  }}
                >
                  完成
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* 創建表單 */
            <form onSubmit={handleCreateOwner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="owner@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="張業主"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEn">英文姓名</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Chang Owner"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">電話</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+886912345678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">初始密碼 *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="至少 6 個字元"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    生成密碼
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>關聯物業 *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">載入中...</p>
                  ) : (
                    properties.map((property) => (
                      <label
                        key={property.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.propertyIds.includes(property.id)}
                          onChange={() => toggleProperty(property.id)}
                        />
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{property.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          ID: {property.id}
                        </Badge>
                      </label>
                    ))
                  )}
                </div>
                {formData.propertyIds.length === 0 && (
                  <p className="text-xs text-destructive">至少選擇一個物業</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isCreating || formData.propertyIds.length === 0}>
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      創建中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      創建業主
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

