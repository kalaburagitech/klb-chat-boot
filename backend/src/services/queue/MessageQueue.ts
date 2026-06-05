import { Queue, Worker, Job } from 'bullmq';
import { sessionManager } from '../whatsapp/SessionManager';
import { ConversationEngine } from '../../modules/conversations/ConversationEngine';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

// Completely stub out MessageQueue for Convex Migration
export const enqueueMessage = async (sessionId: string, to: string, content: string, options?: any) => {
  const client = sessionManager.getClient(sessionId);
  if (client) {
    if (options?.mediaUrl) {
        try {
          let media;
          if (options.mediaUrl.startsWith('http')) {
            const response = await axios.get(options.mediaUrl, { responseType: 'arraybuffer' });
            const base64 = Buffer.from(response.data).toString('base64');
            media = new MessageMedia(options.mediaType === 'PDF' ? 'application/pdf' : 'image/png', base64, options.fileName || 'media');
          } else {
            media = MessageMedia.fromFilePath(options.mediaUrl);
          }
          if (options.sendAsSticker) {
             await client.sendMessage(to, media, { sendMediaAsSticker: true });
          } else {
             await client.sendMessage(to, media);
          }
          
          if (content && content.trim().length > 0) {
              await client.sendMessage(to, content);
          }
        } catch (e) {
          console.error("❌ FAILED TO SEND MEDIA OR STICKER:", e);
          if (content && content.trim().length > 0) {
              await client.sendMessage(to, content);
          }
        }
    } else {
      await client.sendMessage(to, content, options);
    }
  }
};

export const enqueueIncoming = async (sessionId: string, message: any, orgId: string) => {
  await ConversationEngine.processIncoming(orgId || 'klb-connect', sessionId, message.from, message.body);
};
