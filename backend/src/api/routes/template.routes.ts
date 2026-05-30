import { Router } from 'express';
import Template from '../../models/Template';
import Organization from '../../models/Organization';

const router = Router();

// GET /api/v1/templates
router.get('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });
    
    const templates = await Template.find({ organizationId: org._id.toString() });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/v1/templates
router.post('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const template = new Template({ ...req.body, organizationId: org._id.toString() });
    await template.save();
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create template' });
  }
});

export default router;
