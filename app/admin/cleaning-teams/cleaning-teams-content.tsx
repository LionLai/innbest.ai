"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Trash2,
  TestTube,
  Home,
  LogOut,
  Edit,
  Check,
  X,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

interface CleaningTeam {
  id: string;
  name: string;
  description?: string;
  propertyIds: number[];
  notificationChannels: {
    wechat?: { enabled: boolean; webhookUrl?: string };
    discord?: { enabled: boolean; webhookUrl?: string };
  };
  isActive: boolean;
  createdAt: string;
  _count?: { tasks: number };
}

interface Property {
  id: number;
  name: string;
}

export function CleaningTeamsContent() {
  const { user, signOut } = useAuth();
  const [teams, setTeams] = useState<CleaningTeam[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<CleaningTeam | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    propertyIds: [] as number[],
    wechatEnabled: false,
    wechatWebhookUrl: "",
    discordEnabled: false,
    discordWebhookUrl: "",
  });

  useEffect(() => {
    fetchTeams();
    fetchProperties();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/cleaning-teams");
      const result = await response.json();

      if (result.success) {
        setTeams(result.data);
      } else {
        setError(result.error || "載入失敗");
      }
    } catch (err) {
      setError("網路錯誤");
      console.error("載入團隊失敗:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setIsLoadingProperties(true);
      const response = await fetch("/api/admin/properties");
      const result = await response.json();

      if (result.success) {
        const propertyList = result.data.map((p: any) => ({
          id: p.id,
          name: p.name || `Property ${p.id}`,
        }));
        setProperties(propertyList);
      } else {
        console.error("載入物業失敗:", result.error);
      }
    } catch (err) {
      console.error("載入物業失敗:", err);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      // 驗證至少選擇一個物業
      if (formData.propertyIds.length === 0) {
        alert("請至少選擇一個物業");
        return;
      }

      const body = {
        name: formData.name,
        description: formData.description || undefined,
        propertyIds: formData.propertyIds,
        notificationChannels: {
          wechat: {
            enabled: formData.wechatEnabled,
            webhookUrl: formData.wechatWebhookUrl || undefined,
          },
          discord: {
            enabled: formData.discordEnabled,
            webhookUrl: formData.discordWebhookUrl || undefined,
          },
        },
      };

      const url = editingTeam
        ? `/api/admin/cleaning-teams/${editingTeam.id}`
        : "/api/admin/cleaning-teams";
      
      const method = editingTeam ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeams();
        setIsCreateDialogOpen(false);
        setEditingTeam(null);
        resetForm();
      } else {
        alert(result.error || "操作失敗");
      }
    } catch (err) {
      console.error("操作失敗:", err);
      alert("系統錯誤");
    }
  };

  const handleEdit = (team: CleaningTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      propertyIds: team.propertyIds,
      wechatEnabled: team.notificationChannels.wechat?.enabled || false,
      wechatWebhookUrl: team.notificationChannels.wechat?.webhookUrl || "",
      discordEnabled: team.notificationChannels.discord?.enabled || false,
      discordWebhookUrl: team.notificationChannels.discord?.webhookUrl || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm("確定要刪除此團隊嗎？")) return;

    try {
      const response = await fetch(`/api/admin/cleaning-teams/${teamId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeams();
      } else {
        alert(result.error || "刪除失敗");
      }
    } catch (err) {
      console.error("刪除失敗:", err);
      alert("系統錯誤");
    }
  };

  const handleTest = async (teamId: string) => {
    try {
      const response = await fetch(`/api/admin/cleaning-teams/${teamId}/test`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ 測試通知已發送！\n\n" + 
          result.results.map((r: any) => 
            `${r.channel}: ${r.success ? '✅ 成功' : '❌ 失敗' + (r.error ? ` (${r.error})` : '')}`
          ).join('\n')
        );
      } else {
        alert("測試失敗：" + result.error);
      }
    } catch (err) {
      console.error("測試失敗:", err);
      alert("系統錯誤");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      propertyIds: [],
      wechatEnabled: false,
      wechatWebhookUrl: "",
      discordEnabled: false,
      discordWebhookUrl: "",
    });
  };

  const togglePropertySelection = (propertyId: number) => {
    setFormData((prev) => {
      const isSelected = prev.propertyIds.includes(propertyId);
      return {
        ...prev,
        propertyIds: isSelected
          ? prev.propertyIds.filter((id) => id !== propertyId)
          : [...prev.propertyIds, propertyId],
      };
    });
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
                <Badge variant="secondary">清掃團隊管理</Badge>
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
                  <Badge variant="default" className="text-xs">管理員</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Actions */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">團隊列表</h2>
              <p className="text-sm text-muted-foreground">
                共 {teams.length} 個團隊
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                setEditingTeam(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新增團隊
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTeam ? "編輯團隊" : "新增團隊"}
                  </DialogTitle>
                  <DialogDescription>
                    配置清掃團隊和通知渠道
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* 基本資訊 */}
                  <div>
                    <Label htmlFor="name">團隊名稱 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如：池袋清潔隊"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="團隊描述..."
                      rows={2}
                    />
                  </div>

                  {/* 負責物業（多選） */}
                  <div>
                    <Label className="text-base font-medium">負責物業 *</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {formData.propertyIds.length > 0 
                        ? `已選擇 ${formData.propertyIds.length} 個物業`
                        : "請至少選擇一個物業"}
                    </p>
                    
                    {isLoadingProperties ? (
                      <div className="text-sm text-muted-foreground">載入物業列表...</div>
                    ) : properties.length === 0 ? (
                      <div className="text-sm text-muted-foreground">無可用物業</div>
                    ) : (
                      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                        {properties.map((property) => (
                          <label
                            key={property.id}
                            className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.propertyIds.includes(property.id)}
                              onChange={() => togglePropertySelection(property.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{property.name}</div>
                              <div className="text-xs text-muted-foreground">ID: {property.id}</div>
                            </div>
                            {formData.propertyIds.includes(property.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 企業微信 */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">企業微信通知</Label>
                      <input
                        type="checkbox"
                        checked={formData.wechatEnabled}
                        onChange={(e) => setFormData({ ...formData, wechatEnabled: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                    {formData.wechatEnabled && (
                      <div>
                        <Label htmlFor="wechatWebhookUrl">Webhook URL</Label>
                        <Input
                          id="wechatWebhookUrl"
                          value={formData.wechatWebhookUrl}
                          onChange={(e) => setFormData({ ...formData, wechatWebhookUrl: e.target.value })}
                          placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Discord */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Discord 通知</Label>
                      <input
                        type="checkbox"
                        checked={formData.discordEnabled}
                        onChange={(e) => setFormData({ ...formData, discordEnabled: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                    {formData.discordEnabled && (
                      <div>
                        <Label htmlFor="discordWebhookUrl">Webhook URL</Label>
                        <Input
                          id="discordWebhookUrl"
                          value={formData.discordWebhookUrl}
                          onChange={(e) => setFormData({ ...formData, discordWebhookUrl: e.target.value })}
                          placeholder="https://discord.com/api/webhooks/..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateOrUpdate} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      {editingTeam ? "更新" : "創建"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingTeam(null);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      取消
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Teams List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">載入中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchTeams} className="mt-4">
                重新載入
              </Button>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">尚無清掃團隊</p>
              <p className="text-sm text-muted-foreground mt-1">
                點擊「新增團隊」開始
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.description && (
                          <CardDescription className="mt-1">
                            {team.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={team.isActive ? "default" : "secondary"}>
                        {team.isActive ? "啟用" : "停用"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 負責物業 */}
                    <div>
                      <div className="text-sm font-medium mb-2">負責物業</div>
                      <div className="flex flex-wrap gap-1">
                        {team.propertyIds.map((id) => (
                          <Badge key={id} variant="outline" className="text-xs">
                            <Home className="h-3 w-3 mr-1" />
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 通知渠道 */}
                    <div>
                      <div className="text-sm font-medium mb-2">通知渠道</div>
                      <div className="flex flex-wrap gap-1">
                        {team.notificationChannels.wechat?.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            企業微信
                          </Badge>
                        )}
                        {team.notificationChannels.discord?.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            Discord
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 統計 */}
                    {team._count && (
                      <div className="text-sm text-muted-foreground">
                        共 {team._count.tasks} 個任務
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(team.id)}
                        className="flex-1"
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        測試
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(team)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(team.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

