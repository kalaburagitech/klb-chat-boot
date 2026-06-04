import { Client } from 'whatsapp-web.js';
import { ClientFactory } from './ClientFactory';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import { enqueueIncoming } from '../queue/MessageQueue';
import { convex, convexClient } from '../../utils/convex';
import { api } from '../../../convex/_generated/api';

enum SessionStatus {
  INITIALIZING = 'INITIALIZING',
  QR_READY = 'QR_READY',
  AUTHENTICATED = 'AUTHENTICATED',
  READY = 'READY',
  FAILED = 'FAILED',
  DISCONNECTED = 'DISCONNECTED'
}

export class SessionManager {
  private clients: Map<string, Client> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private initializing: Set<string> = new Set();
  private io: Server | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(io?: Server) {
    if (io) this.io = io;
  }

  setIo(io: Server) {
    this.io = io;
  }

  async initAllSessions() {
    console.log(`[INIT] Ready to initialize sessions via Convex subscriptions.`);
    
    // Subscribe to all sessions
    this.unsubscribe = convexClient.onUpdate(
      api.sessions.getAllSessions,
      {},
      (sessions) => {
        for (const session of sessions) {
          // If a session requires initialization OR is already READY/AUTHENTICATED (so we boot it back up on server restart)
          if (
            session.status === SessionStatus.INITIALIZING || 
            session.status === SessionStatus.READY || 
            session.status === SessionStatus.AUTHENTICATED
          ) {
            // We pass a hardcoded org slug for now, but really we should get it from the session
            // In a real app we'd query the org details here if needed.
            this.initializeSession('klb-connect', session.sessionId);
          }
        }
      },
      (error) => {
        console.error("Failed to subscribe to sessions from Convex:", error);
      }
    );
  }

  async initializeSession(orgSlug: string, sessionId: string) {
    if (this.clients.has(sessionId) || this.initializing.has(sessionId)) {
      console.log(`Session ${sessionId} already active or initializing`);
      return;
    }

    this.initializing.add(sessionId);

    try {
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
        this.updateSessionStatus(sessionId, SessionStatus.FAILED, undefined, err.message);
        
        client.destroy().catch(() => {});
        this.clients.delete(sessionId);
        this.initializing.delete(sessionId);
      });
    } catch (e: any) {
      console.error(`Failed to create client for ${sessionId}:`, e);
      this.initializing.delete(sessionId);
      this.updateSessionStatus(sessionId, SessionStatus.FAILED, undefined, e.message);
    }
  }

  private setupEventListeners(client: Client, orgSlug: string, sessionId: string) {
    client.on('qr', async (qr) => {
      console.log(`QR received for ${sessionId} (Room: ${orgSlug})`);
      try {
        const qrImage = await QRCode.toDataURL(qr);
        this.qrCodes.set(sessionId, qrImage);
        this.updateSessionStatus(sessionId, SessionStatus.QR_READY, qrImage);
      } catch (err) {
        console.error(`Failed to generate QR image for ${sessionId}:`, err);
      }
    });

    client.on('authenticated', () => {
      console.log(`🔓 Session ${sessionId} AUTHENTICATED successfully. Waiting for ready...`);
      this.qrCodes.delete(sessionId);
      this.updateSessionStatus(sessionId, SessionStatus.AUTHENTICATED, null);
    });

    client.on('ready', () => {
      console.log('=========================================');
      console.log(`🚀 ✅ WHATSAPP IS READY: ${sessionId}`);
      console.log(`📱 CONNECTED AND LISTENING FOR MESSAGES`);
      console.log('=========================================');
      this.qrCodes.delete(sessionId);
      this.updateSessionStatus(sessionId, SessionStatus.READY, null);
    });

    client.on('auth_failure', (msg) => {
      console.error(`Auth failure for ${sessionId}:`, msg);
      this.updateSessionStatus(sessionId, SessionStatus.FAILED, undefined, msg);
    });

    client.on('disconnected', (reason) => {
      console.log(`Session ${sessionId} disconnected:`, reason);
      this.updateSessionStatus(sessionId, SessionStatus.DISCONNECTED);
      this.clients.delete(sessionId);
    });

    client.on('message_create', async (message) => {
      if (message.fromMe) return; 
      
      console.log(`📩 [WHATSAPP] New message from ${message.from}: "${message.body}"`);

      try {
        await enqueueIncoming(sessionId, {
          from: message.from,
          body: message.body
        }, orgSlug);
      } catch (err) {
        console.error('❌ Error enqueuing message:', err);
      }
    });
  }

  private async updateSessionStatus(sessionId: string, status: SessionStatus, qrCode?: string | null, error?: string) {
    try {
      await convex.mutation(api.sessions.updateSessionStatus, {
        sessionId,
        status,
        qrCode: qrCode === null ? undefined : qrCode,
        error
      });
    } catch (err) {
      console.error(`Failed to sync status to Convex for ${sessionId}:`, err);
    }
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

      // 5. Delete from Convex
      try {
        await convex.mutation(api.sessions.deleteSession, { organizationSlug: orgSlug, sessionId });
      } catch (e) {
        console.error('Failed to delete from convex', e);
      }

      console.log(`[CLEANUP] Session ${sessionId} fully removed from system.`);
    }
  }

  getClient(sessionId: string): Client | undefined {
    return this.clients.get(sessionId);
  }
}

export const sessionManager = new SessionManager();
