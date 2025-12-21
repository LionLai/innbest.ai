/**
 * 通知渠道基礎介面
 * 可抽換設計，支援多種通知渠道
 */

export interface INotificationChannel {
  name: string;
  send(config: any, message: NotificationMessage): Promise<NotificationResult>;
  test(config: any): Promise<boolean>;
}

export interface NotificationMessage {
  type: 'daily' | 'weekly' | 'immediate';
  title: string;
  content: string;
  tasks?: CleaningTaskSummary[];
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface CleaningTaskSummary {
  id: string;
  propertyName: string;
  roomName: string;
  checkOutDate: string;
  checkOutTime: string;
  urgency: string;
  nextCheckIn?: string;
}

