import { Router } from 'express';
import mongoose from 'mongoose';
import WhatsAppSession, { SessionStatus } from '../models/WhatsAppSession';
import Organization from '../models/Organization';
import { sessionManager } from '../services/whatsapp/SessionManager';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Create a new WhatsApp session
router.post('/sessions/create', async (req, res) => {
  try {
    const { name, sessionId, organizationId } = req.body;
    
    // Ensure org exists (fallback to default for now)
    let org = await Organization.findById(organizationId);
    if (!org) {
      org = await Organization.findOne({ slug: 'klb-connect' });
    }

    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const session = await WhatsAppSession.create({
      organizationId: org._id,
      sessionId: sessionId || `session-${Date.now()}`,
      name: name || 'New WhatsApp Session',
      status: SessionStatus.INITIALIZING,
    });

    // Initialize the WhatsApp client
    const sid = (session as any).sessionId;
    await sessionManager.initializeSession('klb-connect', sid);

    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats/:orgIdOrSlug', async (req, res) => {
  try {
    const { orgIdOrSlug } = req.params;
    let orgId = orgIdOrSlug;

    if (!mongoose.Types.ObjectId.isValid(orgIdOrSlug)) {
      const org = await Organization.findOne({ slug: orgIdOrSlug });
      if (org) orgId = org._id.toString();
    }

    const sessions = await WhatsAppSession.find({ organizationId: orgId });
    const readySessions = sessions.filter(s => s.status === 'READY').length;

    // In a real app, these would come from message/lead collections
    res.json({
      activeSessions: readySessions,
      connectedSessions: sessions.length,
      totalLeads: 458, // Placeholder for now
      messagesSent: 1284, // Placeholder for now
      aiReplies: '85%'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions for an organization
router.get('/sessions/:orgIdOrSlug', async (req, res) => {
  try {
    const { orgIdOrSlug } = req.params;
    let orgId = orgIdOrSlug;

    if (!mongoose.Types.ObjectId.isValid(orgIdOrSlug)) {
      const org = await Organization.findOne({ slug: orgIdOrSlug });
      if (org) orgId = org._id.toString();
      else return res.json([]);
    }

    const sessions = await WhatsAppSession.find({ organizationId: orgId });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await WhatsAppSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await sessionManager.destroySession(sessionId, 'klb-connect');
    res.json({ success: true, message: 'Session destroyed and cleaned up successfully' });
  } catch (error: any) {
    console.error('Error in DELETE session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize an existing session
router.get('/sessions/:sessionId/init', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await WhatsAppSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Force re-initialization if requested
    await sessionManager.initializeSession('klb-connect', sessionId);
    
    res.json({ success: true, message: 'Initialization started' });
  } catch (error: any) {
    console.error('Error initializing session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent messages (Placeholder)
router.get('/messages', async (req, res) => {
  res.json([]); // In a real app, fetch from Message model
});

// Get leads (Placeholder)
router.get('/leads', async (req, res) => {
  res.json([]); // In a real app, fetch from Lead model
});

export default router;
