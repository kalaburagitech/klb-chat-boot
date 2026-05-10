import { Client, LocalAuth } from 'whatsapp-web.js';
import mongoose from 'mongoose';

export class ClientFactory {
  static async createClient(sessionId: string): Promise<Client> {
    
    return new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: './.wwebjs_auth'
      }),
      authTimeoutMs: 120000,
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
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
          '--disable-web-security'
        ],
        protocolTimeout: 0,
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
  }
}
