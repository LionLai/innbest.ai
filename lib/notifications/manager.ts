/**
 * 通知管理器
 * 整合所有通知渠道，支援多渠道發送
 */

import { prisma } from '../prisma';
import { WechatWorkChannel } from './wechat-work';
import { DiscordChannel } from './discord';
import { INotificationChannel, NotificationMessage } from './base';
import type { CleaningTeam, NotificationType, NotificationChannel } from '../generated/prisma';

export class NotificationManager {
  private channels: Map<string, INotificationChannel> = new Map();

  constructor() {
    // 註冊所有通知渠道
    this.registerChannel('wechat', new WechatWorkChannel());
    this.registerChannel('discord', new DiscordChannel());
  }

  registerChannel(name: string, channel: INotificationChannel) {
    this.channels.set(name, channel);
  }

  /**
   * 將渠道名稱轉換為 Prisma 枚舉值
   */
  private mapChannelToEnum(channelName: string): NotificationChannel {
    const mapping: Record<string, NotificationChannel> = {
      'wechat': 'WECHAT_WORK',
      'discord': 'DISCORD',
      'email': 'EMAIL',
      'telegram': 'TELEGRAM',
    };
    return mapping[channelName.toLowerCase()] || 'DISCORD';
  }

  /**
   * 發送通知給團隊（支援多渠道）
   */
  async sendToTeam(
    team: CleaningTeam,
    message: NotificationMessage
  ): Promise<{ channel: string; success: boolean; error?: string }[]> {
    const results = [];
    const config = team.notificationChannels as any;

    // 遍歷所有啟用的渠道
    for (const [channelName, channelConfig] of Object.entries(config) as [string, any][]) {
      if (!channelConfig?.enabled) continue;

      const channel = this.channels.get(channelName);
      if (!channel) {
        console.warn(`⚠️  未知的通知渠道: ${channelName}`);
        continue;
      }

      try {
        const result = await channel.send(channelConfig, message);
        
        // 記錄通知歷史
        try {
          await prisma.cleaningNotification.create({
            data: {
              teamId: team.id,
              notificationType: message.type.toUpperCase() as NotificationType,
              channel: this.mapChannelToEnum(channelName),
              recipient: channelConfig.webhookUrl || channelConfig.recipients?.join(',') || '',
              message: JSON.stringify(message),
              taskCount: message.tasks?.length || 0,
              status: result.success ? 'SENT' : 'FAILED',
              sentAt: result.success ? new Date() : null,
              errorMessage: result.error || null,
            },
          });
        } catch (dbError) {
          console.error('❌ 記錄通知歷史失敗:', dbError);
        }

        results.push({
          channel: channelName,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          console.log(`✅ [${channel.name}] 通知已發送給團隊: ${team.name}`);
        } else {
          console.error(`❌ [${channel.name}] 發送失敗:`, result.error);
        }
      } catch (error) {
        const errorMsg = String(error);
        console.error(`❌ [${channelName}] 發送異常:`, error);
        
        results.push({
          channel: channelName,
          success: false,
          error: errorMsg,
        });

        // 記錄錯誤
        try {
          await prisma.cleaningNotification.create({
            data: {
              teamId: team.id,
              notificationType: message.type.toUpperCase() as NotificationType,
              channel: this.mapChannelToEnum(channelName),
              recipient: channelConfig.webhookUrl || '',
              message: JSON.stringify(message),
              taskCount: message.tasks?.length || 0,
              status: 'FAILED',
              errorMessage: errorMsg,
            },
          });
        } catch (dbError) {
          console.error('❌ 記錄錯誤失敗:', dbError);
        }
      }
    }

    return results;
  }

  /**
   * 測試團隊的通知配置
   */
  async testTeamNotifications(team: CleaningTeam): Promise<{
    channel: string;
    success: boolean;
    error?: string;
  }[]> {
    const results = [];
    const config = team.notificationChannels as any;

    for (const [channelName, channelConfig] of Object.entries(config) as [string, any][]) {
      if (!channelConfig?.enabled) {
        results.push({
          channel: channelName,
          success: false,
          error: '渠道未啟用',
        });
        continue;
      }

      const channel = this.channels.get(channelName);
      if (!channel) {
        results.push({
          channel: channelName,
          success: false,
          error: '未知的渠道',
        });
        continue;
      }

      try {
        const success = await channel.test(channelConfig);
        results.push({
          channel: channelName,
          success,
          error: success ? undefined : '測試失敗',
        });
      } catch (error) {
        results.push({
          channel: channelName,
          success: false,
          error: String(error),
        });
      }
    }

    return results;
  }
}

export const notificationManager = new NotificationManager();

