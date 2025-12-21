/**
 * Discord 通知渠道
 */

import { INotificationChannel, NotificationMessage, NotificationResult } from './base';
import { formatDateInTokyo } from '../timezone-utils';

export class DiscordChannel implements INotificationChannel {
  name = 'Discord';

  async send(
    config: { webhookUrl: string },
    message: NotificationMessage
  ): Promise<NotificationResult> {
    try {
      const embed = this.formatEmbed(message);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'innbest.ai 清掃系統',
          avatar_url: 'https://innbest.ai/icon.png',
          embeds: [embed],
        }),
      });

      if (response.ok) {
        console.log('✅ [Discord] 通知發送成功');
        return { success: true };
      } else {
        const error = await response.text();
        console.error('❌ [Discord] 發送失敗:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ [Discord] 發送異常:', error);
      return { success: false, error: String(error) };
    }
  }

  async test(config: { webhookUrl: string }): Promise<boolean> {
    const testMessage: NotificationMessage = {
      type: 'immediate',
      title: '測試通知',
      content: '這是一條測試訊息，如果您看到這則訊息，表示 Discord 通知配置成功！',
    };

    const result = await this.send(config, testMessage);
    return result.success;
  }

  private formatEmbed(message: NotificationMessage): any {
    const urgencyColor = {
      LOW: 0x00ff00,      // 綠色
      NORMAL: 0xffff00,   // 黃色
      HIGH: 0xff9900,     // 橘色
      URGENT: 0xff0000,   // 紅色
    };

    const urgencyEmoji = {
      LOW: '🟢',
      NORMAL: '🟡',
      HIGH: '🟠',
      URGENT: '🔴',
    };

    const fields = [];

    // 根據訊息類型設置描述
    let description = message.content || '';
    if (message.type === 'daily') {
      description = `今日共有 ${message.tasks?.length || 0} 個清掃任務`;
    } else if (message.type === 'weekly') {
      description = `本週共有 ${message.tasks?.length || 0} 個清掃任務`;
    }

    if (message.tasks && message.tasks.length > 0) {
      message.tasks.forEach((task, index) => {
        const emoji = urgencyEmoji[task.urgency as keyof typeof urgencyEmoji] || '⚪';
        
        // 格式化日期：將 UTC 時間轉換為日本時區日期 (YYYY-MM-DD)
        const checkOutDate = formatDateInTokyo(new Date(task.checkOutDate));
        const nextCheckIn = task.nextCheckIn ? formatDateInTokyo(new Date(task.nextCheckIn)) : null;
        
        fields.push({
          name: `${emoji} 任務 ${index + 1} - ${task.propertyName}`,
          value: [
            `**房間：** ${task.roomName}`,
            `**退房：** ${checkOutDate} ${task.checkOutTime}`,
            nextCheckIn ? `**下次入住：** ${nextCheckIn}` : '',
            `**優先級：** ${task.urgency}`,
          ].filter(Boolean).join('\n'),
          inline: false,
        });
      });
    } else if (message.type === 'daily' || message.type === 'weekly') {
      fields.push({
        name: '✨ 無任務',
        value: `${message.type === 'daily' ? '今日' : '本週'}無清掃任務`,
        inline: false,
      });
    }

    // 根據優先級或消息類型決定顏色
    let color = urgencyColor.NORMAL;
    if (message.urgency) {
      color = urgencyColor[message.urgency as keyof typeof urgencyColor] || urgencyColor.NORMAL;
    }

    return {
      title: `🧹 ${message.title}`,
      description,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'innbest.ai 清掃管理系統',
      },
    };
  }
}

