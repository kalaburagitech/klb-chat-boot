import { Router } from 'express';
import AnalyticsLog from '../../models/AnalyticsLog';
import Organization from '../../models/Organization';

const router = Router();

// GET /api/v1/analytics
router.get('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });
    const orgId = org._id.toString();
    
    // Aggregate metrics
    const totalConversations = await AnalyticsLog.countDocuments({ organizationId: orgId, event: 'NEW_CONVERSATION' });
    const failedInputs = await AnalyticsLog.countDocuments({ organizationId: orgId, event: 'FAILED_INPUT' });
    
    // Top menus used
    const menuUsage = await AnalyticsLog.aggregate([
      { $match: { organizationId: orgId, event: 'MENU_USAGE' } },
      { $group: { _id: '$metadata.keyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Top keywords matched
    const keywords = await AnalyticsLog.aggregate([
      { $match: { organizationId: orgId, event: 'KEYWORD_MATCH' } },
      { $group: { _id: '$metadata.keyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent logs
    const recentLogs = await AnalyticsLog.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      metrics: {
        totalConversations,
        failedInputs,
        menuUsage,
        keywords
      },
      recentLogs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
