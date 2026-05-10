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
        backupSyncIntervalMs: 60000, // 60 seconds (minimum required)
        dataPath: './.wwebjs_auth'
      }),
      authTimeoutMs: 120000,
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014588844-alpha.html',
      },
      puppeteer: {
        headless: true,
        executablePath: process.env.CHROME_PATH || undefined,
        defaultViewport: { width: 1280, height: 800 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--no-first-run',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        protocolTimeout: 0,
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
  }
}
