import { Router } from 'express';
import Menu from '../../models/Menu';
import Organization from '../../models/Organization';

const router = Router();

// GET /api/v1/menus
router.get('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const menus = await Menu.find({ organizationId: org._id.toString() });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// POST /api/v1/menus
router.post('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const menu = new Menu({ ...req.body, organizationId: org._id.toString() });
    await menu.save();
    res.status(201).json(menu);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create menu' });
  }
});

export default router;
