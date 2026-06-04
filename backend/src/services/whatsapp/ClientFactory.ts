import { Client, LocalAuth } from 'whatsapp-web.js';


export class ClientFactory {
  static async createClient(sessionId: string): Promise<Client> {
    
    return new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: './.wwebjs_auth'
      }),
      authTimeoutMs: 120000,
      ffmpegPath: require('ffmpeg-static'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      webVersionCache: {
        type: 'local'
      },
      puppeteer: {
        headless: 'new',
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
          '--disable-blink-features=AutomationControlled'
        ],
        protocolTimeout: 0,
      },
    });
  }
}
