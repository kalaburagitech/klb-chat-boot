import { Router } from 'express';
import AutoReplyRule from '../../models/AutoReplyRule';
import Organization from '../../models/Organization';

const router = Router();

// GET /api/v1/rules
router.get('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const rules = await AutoReplyRule.find({ organizationId: org._id.toString() });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// POST /api/v1/rules
router.post('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const rule = new AutoReplyRule({ ...req.body, organizationId: org._id.toString() });
    await rule.save();
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create rule' });
  }
});

export default router;
