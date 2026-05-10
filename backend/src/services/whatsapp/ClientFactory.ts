import { Client, RemoteAuth } from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';
import { SessionStatus } from '../../models/WhatsAppSession';

export class ClientFactory {
  private static store: any = null;

  static async getStore(): Promise<any> {
    if (!this.store) {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Mongoose connection not established');
      }
      this.store = new MongoStore({ mongoose });
    }
    return this.store;
  }

  static async createClient(sessionId: string): Promise<Client> {
    const store = await this.getStore();
    
    return new Client({
      authStrategy: new RemoteAuth({
        clientId: sessionId,
        store: store,
        backupSyncIntervalMs: 20000, // 20 seconds - much faster sync for Railway stability
        dataPath: './.wwebjs_auth'
      }),
      authTimeoutMs: 120000, // Increase to 2 minutes
      puppeteer: {
        headless: true,
        executablePath: process.env.CHROME_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--no-first-run',
          '--disable-extensions',
          '--disable-software-rasterizer'
        ],
        protocolTimeout: 0,
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
  }
}
