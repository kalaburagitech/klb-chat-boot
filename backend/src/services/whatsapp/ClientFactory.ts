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
        backupSyncIntervalMs: 600000, // 10 minutes
        dataPath: './.wwebjs_auth' // Explicit path to avoid root directory clutter
      }),
      authTimeoutMs: 60000,
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--no-first-run',
        ],
        protocolTimeout: 0,
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
  }
}
