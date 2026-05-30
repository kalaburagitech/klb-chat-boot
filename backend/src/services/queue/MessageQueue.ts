import { Queue, Worker, Job } from 'bullmq';
import { sessionManager } from '../whatsapp/SessionManager';
import WhatsAppSession from '../../models/WhatsAppSession';
import { ConversationEngine } from '../../modules/conversations/ConversationEngine';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let incomingQueue: Queue | null = null;
let outgoingQueue: Queue | null = null;

if (REDIS_URL) {
  const createRedisConnection = () => {
    const conn = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        console.warn(`⚠️ Redis reconnecting... attempt ${times}`);
        return Math.min(times * 50, 2000);
      }
    });
    conn.on('error', (err: any) => {
      if (err.code === 'ECONNRESET') {
        console.warn('⚠️ Redis connection reset (ECONNRESET). Auto-reconnecting...');
      } else {
        console.error('Redis Error:', err.message);
      }
    });
    return conn;
  };

  incomingQueue = new Queue('incoming-messages', { connection: createRedisConnection() });
  outgoingQueue = new Queue('outgoing-messages', { connection: createRedisConnection() });

  new Worker('outgoing-messages', async (job: Job) => {
    const { sessionId, to, content, options } = job.data;
    const client = sessionManager.getClient(sessionId);
    if (!client) throw new Error(`Client ${sessionId} not found`);

    const session = await WhatsAppSession.findOne({ sessionId });
    const delay = session?.settings.typingDelay || { min: 2000, max: 5000 };
    const waitTime = Math.floor(Math.random() * (delay.max - delay.min + 1) + delay.min);
    
    const chat = await client.getChatById(to);
    await chat.sendStateTyping();
    await new Promise(resolve => setTimeout(resolve, waitTime));

    if (job.data.mediaUrl) {
      try {
        let media: MessageMedia;
        if (job.data.mediaUrl.startsWith('http')) {
          const response = await axios.get(job.data.mediaUrl, { 
            responseType: 'arraybuffer', timeout: 10000, headers: { 'User-Agent': 'KLB-Chat-Bot/1.0' }
          });
          const base64 = Buffer.from(response.data).toString('base64');
          media = new MessageMedia(job.data.mediaType === 'PDF' ? 'application/pdf' : 'image/png', base64, job.data.fileName || 'media');
        } else {
          media = MessageMedia.fromFilePath(job.data.mediaUrl);
        }
        await client.sendMessage(to, media, { caption: content });
      } catch (err) {
        console.error('Failed to send media:', err);
        if (content) await client.sendMessage(to, content);
      }
    } else {
      await client.sendMessage(to, content, options);
    }
    await chat.clearState();
    console.log(`Message sent to ${to} via ${sessionId}`);
  }, {
    connection: createRedisConnection(),
    limiter: { max: 1, duration: 3000 }
  });

  new Worker('incoming-messages', async (job: Job) => {
    try {
      const { sessionId, message, orgId } = job.data;
      console.log(`[QUEUE] Processing incoming message from ${message.from} on ${sessionId}`);
      await ConversationEngine.processIncoming(orgId || 'klb-connect', sessionId, message.from, message.body);
    } catch (err) {
      console.error('❌ [QUEUE] ERROR IN INCOMING WORKER:', err);
    }
  }, { connection: createRedisConnection() });
}

export const enqueueMessage = async (sessionId: string, to: string, content: string, options?: any) => {
  if (outgoingQueue) {
    return outgoingQueue.add('send-message', { sessionId, to, content, ...options });
  } else {
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
           await client.sendMessage(to, media, { caption: content });
         } catch (e) {
           await client.sendMessage(to, content);
         }
      } else {
        await client.sendMessage(to, content, options);
      }
    }
  }
};

export const enqueueIncoming = async (sessionId: string, message: any, orgId: string) => {
  if (incomingQueue) {
    return incomingQueue.add('process-incoming', { sessionId, message, orgId });
  } else {
    await ConversationEngine.processIncoming(orgId || 'klb-connect', sessionId, message.from, message.body);
  }
};
