import { Client } from 'whatsapp-web.js';
import { ClientFactory } from './ClientFactory';
import WhatsAppSession, { SessionStatus } from '../../models/WhatsAppSession';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import { enqueueIncoming } from '../queue/MessageQueue';

export class SessionManager {
  private clients: Map<string, Client> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private io: Server | null = null;

  constructor(io?: Server) {
    if (io) this.io = io;
  }

  setIo(io: Server) {
    this.io = io;
  }

  async initAllSessions() {
    const sessions = await WhatsAppSession.find({ status: SessionStatus.READY });
    console.log(`[INIT] Found ${sessions.length} READY sessions to restore.`);
    
    for (const session of sessions) {
      try {
        console.log(`[INIT] Staggering initialization for ${session.sessionId}...`);
        await this.initializeSession('klb-connect', session.sessionId);
        // Wait 5 seconds between each session to prevent Puppeteer resource spikes
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`[INIT] Failed to restore session ${session.sessionId}:`, error);
      }
    }
  }

  async initializeSession(orgSlug: string, sessionId: string) {
    if (this.clients.has(sessionId)) {
      console.log(`Session ${sessionId} already active`);
      
      // If we already have a QR code for this active session, emit it again
      const storedQr = this.qrCodes.get(sessionId);
      if (storedQr) {
        this.io?.to(orgSlug).emit('whatsapp:qr', { sessionId, qr: storedQr });
      }
      return;
    }

    const client = await ClientFactory.createClient(sessionId);
    this.clients.set(sessionId, client);

    this.setupEventListeners(client, orgSlug, sessionId);
    
    console.log(`Initializing client for session: ${sessionId}`);
    client.initialize().catch(err => {
      console.error('=========================================');
      console.error(`❌ FAILED TO INITIALIZE WHATSAPP: ${sessionId}`);
      
      if (err.message.includes('detached') || err.message.includes('closed')) {
        console.error('⚠️ PUPPETEER ERROR: Browser was closed or frame detached.');
      } else {
        console.error(err);
      }
      
      console.error('=========================================');
      this.updateSessionStatus(sessionId, SessionStatus.FAILED);
      this.io?.to(orgSlug).emit('whatsapp:status', { sessionId, status: SessionStatus.FAILED, error: err.message });
      
      // Clean up the client to prevent leaks
      client.destroy().catch(() => {});
      this.clients.delete(sessionId);
    });
  }

  private setupEventListeners(client: Client, orgSlug: string, sessionId: string) {
    client.on('qr', async (qr) => {
      console.log(`QR received for ${sessionId} (Room: ${orgSlug})`);
      try {
        const qrImage = await QRCode.toDataURL(qr);
        this.qrCodes.set(sessionId, qrImage);
        this.updateSessionStatus(sessionId, SessionStatus.QR_READY);
        this.io?.to(orgSlug).emit('whatsapp:status', { sessionId, status: SessionStatus.QR_READY });
        this.io?.to(orgSlug).emit('whatsapp:qr', { sessionId, qr: qrImage });
      } catch (err) {
        console.error(`Failed to generate QR image for ${sessionId}:`, err);
      }
    });

    client.on('authenticated', () => {
      console.log(`🔓 Session ${sessionId} AUTHENTICATED successfully. Waiting for ready...`);
      this.qrCodes.delete(sessionId);
      this.updateSessionStatus(sessionId, SessionStatus.AUTHENTICATED);
      this.io?.to(orgSlug).emit('whatsapp:status', { sessionId, status: SessionStatus.AUTHENTICATED });
      this.io?.to(orgSlug).emit('whatsapp:authenticated', { sessionId });
    });

    client.on('ready', () => {
      console.log(`✅ Session ${sessionId} is READY and CONNECTED`);
      this.qrCodes.delete(sessionId);
      this.updateSessionStatus(sessionId, SessionStatus.READY);
      this.io?.to(orgSlug).emit('whatsapp:status', { sessionId, status: SessionStatus.READY });
      this.io?.to(orgSlug).emit('whatsapp:ready', { sessionId });
    });

    client.on('auth_failure', (msg) => {
      console.error(`Auth failure for ${sessionId}:`, msg);
      this.updateSessionStatus(sessionId, SessionStatus.FAILED);
      this.io?.to(orgSlug).emit('whatsapp:auth_failure', { sessionId, message: msg });
    });

    client.on('disconnected', (reason) => {
      console.log(`Session ${sessionId} disconnected:`, reason);
      this.updateSessionStatus(sessionId, SessionStatus.DISCONNECTED);
      this.io?.to(orgSlug).emit('whatsapp:disconnected', { sessionId, reason });
      this.clients.delete(sessionId);
    });

    client.on('message', async (message) => {
      console.log(`New message from ${message.from} for ${sessionId}`);
      this.io?.to(orgSlug).emit('whatsapp:message', { 
        sessionId, 
        from: message.from, 
        body: message.body 
      });
      
      // Enqueue for processing
      await enqueueIncoming(sessionId, message, orgSlug);
    });
  }

  private async updateSessionStatus(sessionId: string, status: SessionStatus) {
    await WhatsAppSession.findOneAndUpdate({ sessionId }, { 
      status, 
      lastActive: new Date() 
    });
  }

  async destroySession(sessionId: string, orgSlug: string) {
    const client = this.clients.get(sessionId);
    console.log(`[CLEANUP] Initializing full destruction for session: ${sessionId}`);

    try {
      if (client) {
        // 1. Remove all event listeners to prevent memory leaks
        client.removeAllListeners();

        // 2. Safely attempt logout (clears RemoteAuth data)
        try {
          await Promise.race([
            client.logout(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 5000))
          ]);
          console.log(`[CLEANUP] WhatsApp logout successful for ${sessionId}`);
        } catch (e) {
          console.log(`[CLEANUP] Logout failed or timed out for ${sessionId}, forcing destroy...`);
        }

        // 3. Destroy client and close Puppeteer browser
        try {
          await client.destroy();
          console.log(`[CLEANUP] Puppeteer browser closed for ${sessionId}`);
        } catch (e) {
          console.error(`[CLEANUP] Failed to destroy client ${sessionId}:`, e);
        }
      }
    } catch (error) {
      console.error(`[CLEANUP] Critical error during session cleanup for ${sessionId}:`, error);
    } finally {
      // 4. Remove from memory
      this.clients.delete(sessionId);
      this.qrCodes.delete(sessionId);

      // 5. Delete from MongoDB
      await WhatsAppSession.deleteOne({ sessionId });

      // 6. Emit real-time deletion event
      this.io?.to(orgSlug).emit('whatsapp:status', { sessionId, status: SessionStatus.DISCONNECTED });
      this.io?.to(orgSlug).emit('whatsapp:deleted', { sessionId });

      console.log(`[CLEANUP] Session ${sessionId} fully removed from system.`);
    }
  }

  getClient(sessionId: string): Client | undefined {
    return this.clients.get(sessionId);
  }
}

export const sessionManager = new SessionManager();
