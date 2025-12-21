/**
 * 企業微信通知渠道
 */

import { INotificationChannel, NotificationMessage, NotificationResult } from './base';
import { formatDateInTokyo } from '../timezone-utils';

export class WechatWorkChannel implements INotificationChannel {
  name = 'WeChat Work';

  async send(
    config: { webhookUrl: string },
    message: NotificationMessage
  ): Promise<NotificationResult> {
    try {
      const markdown = this.formatMessage(message);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            content: markdown,
          },
        }),
      });

      const result = await response.json();

      if (result.errcode === 0) {
        console.log('✅ [企業微信] 通知發送成功');
        return { success: true };
      } else {
        console.error('❌ [企業微信] 發送失敗:', result.errmsg);
        return { success: false, error: result.errmsg };
      }
    } catch (error) {
      console.error('❌ [企業微信] 發送異常:', error);
      return { success: false, error: String(error) };
    }
  }

  async test(config: { webhookUrl: string }): Promise<boolean> {
    const testMessage: NotificationMessage = {
      type: 'immediate',
      title: '測試通知',
      content: '這是一條測試訊息，如果您看到這則訊息，表示企業微信通知配置成功！',
    };

    const result = await this.send(config, testMessage);
    return result.success;
  }

  private formatMessage(message: NotificationMessage): string {
    const urgencyEmoji = {
      LOW: '🟢',
      NORMAL: '🟡',
      HIGH: '🟠',
      URGENT: '🔴',
    };

    let content = `### 🧹 ${message.title}\n\n`;
    content += `**時間：** ${new Date().toLocaleString('zh-TW', {
      timeZone: 'Asia/Tokyo',
    })}\n\n`;

    if (message.type === 'weekly') {
      content += `**本週清掃任務總覽**\n`;
      content += `**總任務數：** ${message.tasks?.length || 0}\n\n`;
    } else if (message.type === 'daily') {
      content += `**今日清掃任務**\n`;
      content += `**任務數：** ${message.tasks?.length || 0}\n\n`;
    } else {
      content += `${message.content}\n\n`;
    }

    content += `---\n\n`;

    if (message.tasks && message.tasks.length > 0) {
      message.tasks.forEach((task, index) => {
        const emoji = urgencyEmoji[task.urgency as keyof typeof urgencyEmoji] || '⚪';
        
        // 格式化日期：將 UTC 時間轉換為日本時區日期 (YYYY-MM-DD)
        const checkOutDate = formatDateInTokyo(new Date(task.checkOutDate));
        const nextCheckIn = task.nextCheckIn ? formatDateInTokyo(new Date(task.nextCheckIn)) : null;
        
        content += `#### ${emoji} 任務 ${index + 1}\n`;
        content += `> **物業：** ${task.propertyName}\n`;
        content += `> **房間：** ${task.roomName}\n`;
        content += `> **退房：** ${checkOutDate} ${task.checkOutTime}\n`;
        
        if (nextCheckIn) {
          content += `> **下次入住：** ${nextCheckIn}\n`;
        }
        
        content += `> **優先級：** ${task.urgency}\n\n`;
      });
    } else if (message.type === 'daily' || message.type === 'weekly') {
      content += `✨ ${message.type === 'daily' ? '今日' : '本週'}無清掃任務\n\n`;
    }

    if (message.tasks && message.tasks.length > 0) {
      content += `---\n`;
      content += `請團隊及時完成清掃工作 🙏`;
    }

    return content;
  }
}

