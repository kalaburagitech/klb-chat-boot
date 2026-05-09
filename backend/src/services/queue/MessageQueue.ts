import { Queue, Worker, Job } from 'bullmq';
import { sessionManager } from '../whatsapp/SessionManager';
import WhatsAppSession from '../../models/WhatsAppSession';
import { ChatbotEngine } from '../whatsapp/ChatbotEngine';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared Redis connection for better performance and resource management
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const incomingQueue = new Queue('incoming-messages', {
  connection: redisConnection
});

export const outgoingQueue = new Queue('outgoing-messages', {
  connection: redisConnection
});

// Worker for Outgoing Messages (Anti-Ban Throttling)
const outgoingWorker = new Worker('outgoing-messages', async (job: Job) => {
  const { sessionId, to, content, options } = job.data;
  const client = sessionManager.getClient(sessionId);

  if (!client) {
    throw new Error(`Client ${sessionId} not found`);
  }

  const session = await WhatsAppSession.findOne({ sessionId });
  const delay = session?.settings.typingDelay || { min: 2000, max: 5000 };
  
  // Human-like typing delay
  const waitTime = Math.floor(Math.random() * (delay.max - delay.min + 1) + delay.min);
  
  // Simulate typing
  const chat = await client.getChatById(to);
  await chat.sendStateTyping();
  await new Promise(resolve => setTimeout(resolve, waitTime));

  // Send message
  if (job.data.mediaUrl) {
    try {
      let media: MessageMedia;
      if (job.data.mediaUrl.startsWith('http')) {
        const response = await axios.get(job.data.mediaUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000, // 10s timeout
          headers: { 'User-Agent': 'KLB-Chat-Bot/1.0' }
        });
        let buffer = Buffer.from(response.data);

        // Send original image without processing as requested
        const base64 = buffer.toString('base64');
        media = new MessageMedia(
          job.data.mediaType === 'PDF' ? 'application/pdf' : 'image/png',
          base64,
          job.data.fileName || 'media'
        );
      } else {
        // Assume local file path
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
  connection: redisConnection,
  limiter: {
    max: 1, // One message at a time per worker instance
    duration: 3000, // 3 seconds between jobs to be safe
  }
});

// Worker for Incoming Messages (Chatbot/AI Engine)
const incomingWorker = new Worker('incoming-messages', async (job: Job) => {
  const { sessionId, message, orgId } = job.data;
  
  console.log(`Processing incoming message from ${message.from} on ${sessionId}`);
  
  // Route to Chatbot Engine
  await ChatbotEngine.processIncoming(
    orgId || 'default_org', 
    sessionId, 
    message.from, 
    message.body
  );
  
}, {
  connection: redisConnection
});

export const enqueueMessage = (sessionId: string, to: string, content: string, options?: any) => {
  return outgoingQueue.add('send-message', { sessionId, to, content, ...options });
};

export const enqueueIncoming = (sessionId: string, message: any, orgId: string) => {
  return incomingQueue.add('process-incoming', { sessionId, message, orgId });
};
