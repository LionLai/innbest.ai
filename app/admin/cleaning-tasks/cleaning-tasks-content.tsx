"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Filter,
  LogOut,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  LayoutDashboard,
  Bell,
  BellRing,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";

interface CleaningTask {
  id: string;
  beds24BookingId: number;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomName: string;
  checkOutDate: string;
  cleaningDate: string;
  nextCheckIn?: string;
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "NOTIFIED" | "COMPLETED" | "CANCELLED";
  team?: {
    id: string;
    name: string;
  };
  notes?: string;
}

interface Property {
  id: number;
  name: string;
}

const urgencyConfig = {
  LOW: { label: "低", color: "bg-gray-500" },
  NORMAL: { label: "一般", color: "bg-blue-500" },
  HIGH: { label: "高", color: "bg-orange-500" },
  URGENT: { label: "緊急", color: "bg-red-500" },
};

const statusConfig = {
  PENDING: { label: "待處理", icon: Clock, color: "text-yellow-600" },
  NOTIFIED: { label: "已通知", icon: AlertCircle, color: "text-blue-600" },
  COMPLETED: { label: "已完成", icon: CheckCircle, color: "text-green-600" },
  CANCELLED: { label: "已取消", icon: XCircle, color: "text-gray-600" },
};

export function CleaningTasksContent() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifyingTaskId, setNotifyingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    cancelled: number;
  } | null>(null);

  // 視圖模式
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 過濾條件
  const [filters, setFilters] = useState({
    status: "",
    urgency: "",
    propertyId: "",
    date: "",
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, []);

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

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.propertyId) params.append("propertyId", filters.propertyId);
      if (filters.date) params.append("date", filters.date);

      const response = await fetch(`/api/admin/cleaning-tasks?${params}`);
      const result = await response.json();

      if (result.success) {
        // API 返回 { data: { tasks: [...], pagination: {...} } }
        const tasksData = result.data?.tasks || result.data;
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } else {
        setError(result.error || "載入失敗");
        setTasks([]); // 錯誤時設置為空數組
      }
    } catch (err) {
      setError("網路錯誤");
      setTasks([]); // 錯誤時設置為空數組
      console.error("載入任務失敗:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/cleaning-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("任務狀態已更新");
        await fetchTasks();
      } else {
        toast.error(result.error || "更新失敗");
      }
    } catch (err) {
      console.error("更新失敗:", err);
      toast.error("系統錯誤");
    }
  };

  const handleSync = async () => {
    if (!confirm("確定要從 Beds24 同步最新訂單嗎？\n這可能需要幾秒鐘時間。")) {
      return;
    }

    try {
      setIsSyncing(true);
      setSyncResult(null);
      setError(null);

      const response = await fetch("/api/admin/cleaning-tasks/sync", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setSyncResult(result.data);
        
        // 顯示同步結果
        const { created, updated, cancelled } = result.data;
        const description = `新增任務：${created} 個 | 更新任務：${updated} 個 | 取消任務：${cancelled} 個`;
        toast.success("同步完成", { description });

        // 重新載入任務列表
        await fetchTasks();
      } else {
        setError(result.error || "同步失敗");
        toast.error("同步失敗", { description: result.error });
      }
    } catch (err) {
      console.error("同步失敗:", err);
      setError("網路錯誤");
      toast.error("同步失敗：網路錯誤");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNotify = async (type: 'daily' | 'weekly' | 'task', taskId?: string) => {
    const typeNames = { daily: '當日', weekly: '當週', task: '此任務' };
    const confirmMsg = `確定要立即發送${typeNames[type]}通知嗎？`;
    
    if (!confirm(confirmMsg)) return;

    try {
      if (type === 'task' && taskId) {
        setNotifyingTaskId(taskId);
      } else {
        setIsNotifying(true);
      }

      const response = await fetch("/api/admin/cleaning-tasks/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, taskId }),
      });

      const result = await response.json();

      if (result.success) {
        const { sent, taskCount, results } = result;
        
        let description = `任務數：${taskCount} 個 | 發送次數：${sent} 次`;
        
        if (results && results.length > 0) {
          const detailResults = results.map((r: any) => {
            const status = r.success ? '✅' : '❌';
            return `${r.team} (${r.channel}): ${status}`;
          }).join(' | ');
          description += ` | ${detailResults}`;
        }
        
        toast.success("通知已發送", { description });
        await fetchTasks();
      } else {
        toast.error("發送通知失敗", { description: result.error });
      }
    } catch (err) {
      console.error("發送通知失敗:", err);
      toast.error("發送通知失敗：網路錯誤");
    } finally {
      setIsNotifying(false);
      setNotifyingTaskId(null);
    }
  };

  const formatDate = (dateString: string) => {
    // 將 UTC 日期轉換為日本時區顯示
    const date = new Date(dateString);
    const tokyoDate = toZonedTime(date, 'Asia/Tokyo');
    return format(tokyoDate, "yyyy/MM/dd (E)", { locale: zhTW });
  };

  const getTodayTasks = () => {
    // 防禦性檢查：確保 tasks 是數組
    if (!Array.isArray(tasks)) {
      return [];
    }
    
    const today = format(new Date(), "yyyy-MM-dd");
    return tasks.filter(
      (task) =>
        format(new Date(task.cleaningDate), "yyyy-MM-dd") === today &&
        task.status !== "COMPLETED" &&
        task.status !== "CANCELLED"
    );
  };

  // 月曆相關函數
  const getTasksForDate = (date: Date) => {
    if (!Array.isArray(tasks)) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return tasks.filter(
      (task) => format(new Date(task.checkOutDate), "yyyy-MM-dd") === dateStr
    );
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 獲取當月第一天
    const firstDay = new Date(year, month, 1);
    // 獲取當月最後一天
    const lastDay = new Date(year, month + 1, 0);
    
    // 獲取第一天是星期幾（0=日, 1=一, ...）
    const firstDayOfWeek = firstDay.getDay();
    // 獲取當月總天數
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // 補足月初空白
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // 填入當月日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)
    );
  };

  const todayTasks = getTodayTasks();

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
                <Badge variant="secondary">清掃任務管理</Badge>
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
          {/* 今日任務統計 */}
          {todayTasks.length > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900">
                  今日待處理任務：{todayTasks.length} 個
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {/* 過濾器 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                篩選條件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">狀態</label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="PENDING">待處理</SelectItem>
                      <SelectItem value="NOTIFIED">已通知</SelectItem>
                      <SelectItem value="COMPLETED">已完成</SelectItem>
                      <SelectItem value="CANCELLED">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">優先級</label>
                  <Select
                    value={filters.urgency || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, urgency: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="LOW">低</SelectItem>
                      <SelectItem value="NORMAL">一般</SelectItem>
                      <SelectItem value="HIGH">高</SelectItem>
                      <SelectItem value="URGENT">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">物業</label>
                  <Select
                    value={filters.propertyId || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, propertyId: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="全部物業" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部物業</SelectItem>
                      {isLoadingProperties ? (
                        <SelectItem value="loading" disabled>
                          載入中...
                        </SelectItem>
                      ) : properties.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          無可用物業
                        </SelectItem>
                      ) : (
                        properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name} (ID: {property.id})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">清掃日期</label>
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters({ ...filters, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2 flex-wrap items-center">
                {/* 視圖切換 */}
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    列表
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    月曆
                  </Button>
                </div>

                <div className="h-6 w-px bg-border mx-1" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      status: "",
                      urgency: "",
                      propertyId: "",
                      date: "",
                    })
                  }
                >
                  清除篩選
                </Button>
                <Button variant="outline" size="sm" onClick={fetchTasks} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  重新載入
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSync} 
                  disabled={isSyncing || isLoading}
                  className="bg-primary"
                >
                  <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
                  {isSyncing ? "同步中..." : "從 Beds24 同步"}
                </Button>
                
                <div className="h-6 w-px bg-border mx-1" />
                
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleNotify('daily')} 
                  disabled={isNotifying || isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Bell className={`h-4 w-4 mr-2 ${isNotifying ? 'animate-pulse' : ''}`} />
                  立即當日通知
                </Button>
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleNotify('weekly')} 
                  disabled={isNotifying || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <BellRing className={`h-4 w-4 mr-2 ${isNotifying ? 'animate-pulse' : ''}`} />
                  立即當週通知
                </Button>
              </div>
              
              {/* 同步結果提示 */}
              {syncResult && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-sm text-green-800">
                    <span className="font-medium">✅ 上次同步：</span>
                    <span className="ml-2">
                      新增 {syncResult.created} 個，更新 {syncResult.updated} 個，取消 {syncResult.cancelled} 個
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 月曆視圖或列表視圖 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">載入中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchTasks} className="mt-4">
                重新載入
              </Button>
            </div>
          ) : viewMode === "calendar" ? (
            /* 月曆視圖 */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(currentMonth, "yyyy年 MM月", { locale: zhTW })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth(-1)}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date())}
                    >
                      今天
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth(1)}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 星期標題 */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日期格子 */}
                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateTasks = getTasksForDate(date);
                    const isToday =
                      format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (dateTasks.length > 0) {
                            setSelectedDate(date);
                          }
                        }}
                        className={`
                          aspect-square p-2 rounded-lg border transition-all
                          ${isToday ? "border-primary border-2" : "border-border"}
                          ${dateTasks.length > 0 ? "hover:bg-accent cursor-pointer" : "cursor-default"}
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <span className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>
                            {format(date, "d")}
                          </span>
                          {dateTasks.length > 0 && (
                            <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                              {dateTasks.slice(0, 3).map((task) => (
                                <div
                                  key={task.id}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${urgencyConfig[task.urgency].color} text-white`}
                                  title={task.roomName}
                                >
                                  {task.roomName}
                                </div>
                              ))}
                              {dateTasks.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dateTasks.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : !Array.isArray(tasks) || tasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">沒有符合條件的任務</p>
            </div>
          ) : (
            /* 列表視圖 */
            <div className="space-y-4">
              {tasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                return (
                  <Card key={task.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* 標題行 */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {task.propertyName}
                            </h3>
                            <Badge
                              className={`${urgencyConfig[task.urgency].color} text-white`}
                            >
                              {urgencyConfig[task.urgency].label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={statusConfig[task.status].color}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[task.status].label}
                            </Badge>
                          </div>

                          {/* 房間資訊 */}
                          <div className="text-sm text-muted-foreground mb-3 space-y-1">
                            <p>
                              房間：{task.roomName} (ID: {task.roomId})
                            </p>
                            {task.beds24BookingId && (
                              <p>
                                訂單號：
                                <span className="font-mono text-primary ml-1">
                                  #{task.beds24BookingId}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* 日期資訊 */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">退房日期：</span>
                              <span className="font-medium">
                                {formatDate(task.checkOutDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">清掃日期：</span>
                              <span className="font-medium">
                                {formatDate(task.cleaningDate)}
                              </span>
                            </div>
                            {task.nextCheckIn && (
                              <div>
                                <span className="text-muted-foreground">下次入住：</span>
                                <span className="font-medium">
                                  {formatDate(task.nextCheckIn)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 團隊資訊 */}
                          {task.team && (
                            <div className="text-sm mb-3">
                              <span className="text-muted-foreground">負責團隊：</span>
                              <Badge variant="secondary">{task.team.name}</Badge>
                            </div>
                          )}

                          {/* 備註 */}
                          {task.notes && (
                            <div className="text-sm text-muted-foreground">
                              備註：{task.notes}
                            </div>
                          )}
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex flex-col gap-2 ml-4">
                          {task.team && (task.status === "PENDING" || task.status === "NOTIFIED") && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleNotify('task', task.id)}
                              disabled={notifyingTaskId === task.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Bell className={`h-4 w-4 mr-1 ${notifyingTaskId === task.id ? 'animate-pulse' : ''}`} />
                              {notifyingTaskId === task.id ? "發送中..." : "立即通知"}
                            </Button>
                          )}
                          {task.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(task.id, "NOTIFIED")}
                            >
                              標記已通知
                            </Button>
                          )}
                          {(task.status === "PENDING" || task.status === "NOTIFIED") && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, "COMPLETED")}
                            >
                              標記完成
                            </Button>
                          )}
                          {task.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(task.id, "CANCELLED")}
                            >
                              取消
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 日期詳情 Modal */}
          {selectedDate && (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedDate(null)}
            >
              <div
                className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                      {format(selectedDate, "yyyy年 MM月 dd日 (E)", { locale: zhTW })} 的清掃任務
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    共 {getTasksForDate(selectedDate).length} 個任務
                  </p>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {getTasksForDate(selectedDate).map((task) => {
                      const StatusIcon = statusConfig[task.status].icon;
                      return (
                        <Card key={task.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* 標題行 */}
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-base font-semibold">
                                    {task.propertyName}
                                  </h3>
                                  <Badge
                                    className={`${urgencyConfig[task.urgency].color} text-white text-xs`}
                                  >
                                    {urgencyConfig[task.urgency].label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`${statusConfig[task.status].color} text-xs`}
                                  >
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig[task.status].label}
                                  </Badge>
                                </div>

                                {/* 房間資訊 */}
                                <div className="text-sm text-muted-foreground mb-2">
                                  <p>房間：{task.roomName} (ID: {task.roomId})</p>
                                  {task.beds24BookingId && (
                                    <p>
                                      訂單號：
                                      <span className="font-mono text-primary ml-1">
                                        #{task.beds24BookingId}
                                      </span>
                                    </p>
                                  )}
                                </div>

                                {/* 日期資訊 */}
                                <div className="text-sm space-y-1">
                                  <div>
                                    <span className="text-muted-foreground">退房時間：</span>
                                    <span className="font-medium">
                                      {format(new Date(task.checkOutDate), "HH:mm")}
                                    </span>
                                  </div>
                                  {task.nextCheckIn && (
                                    <div>
                                      <span className="text-muted-foreground">下次入住：</span>
                                      <span className="font-medium">
                                        {format(new Date(task.nextCheckIn), "MM/dd (E)", { locale: zhTW })}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* 團隊資訊 */}
                                {task.team && (
                                  <div className="text-sm mt-2">
                                    <span className="text-muted-foreground">負責團隊：</span>
                                    <Badge variant="secondary" className="ml-1">
                                      {task.team.name}
                                    </Badge>
                                  </div>
                                )}

                                {/* 備註 */}
                                {task.notes && (
                                  <div className="text-sm text-muted-foreground mt-2">
                                    備註：{task.notes}
                                  </div>
                                )}
                              </div>

                              {/* 操作按鈕 */}
                              <div className="flex flex-col gap-2 ml-4">
                                {task.team && (task.status === "PENDING" || task.status === "NOTIFIED") && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setSelectedDate(null);
                                      handleNotify('task', task.id);
                                    }}
                                    disabled={notifyingTaskId === task.id}
                                    className="bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    {notifyingTaskId === task.id ? "發送中..." : "立即通知"}
                                  </Button>
                                )}
                                {task.status === "PENDING" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedDate(null);
                                      handleUpdateStatus(task.id, "NOTIFIED");
                                    }}
                                    className="text-xs"
                                  >
                                    標記已通知
                                  </Button>
                                )}
                                {(task.status === "PENDING" || task.status === "NOTIFIED") && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDate(null);
                                      handleUpdateStatus(task.id, "COMPLETED");
                                    }}
                                    className="text-xs"
                                  >
                                    標記完成
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

