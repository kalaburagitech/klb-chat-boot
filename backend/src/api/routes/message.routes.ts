import { Router } from 'express';
import { enqueueMessage } from '../../services/queue/MessageQueue';

const router = Router();

// POST /api/v1/messages/send
router.post('/send', async (req, res) => {
  try {
    const { sessionId, to, content, mediaUrl, mediaType } = req.body;
    
    if (!sessionId || !to || (!content && !mediaUrl)) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, to, content/mediaUrl' });
    }

    await enqueueMessage(sessionId, to, content || '', { mediaUrl, mediaType });
    
    res.status(200).json({ success: true, message: 'Message enqueued' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enqueue message' });
  }
});

export default router;
