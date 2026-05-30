import { Router } from 'express';
import Schedule from '../../models/Schedule';
import Organization from '../../models/Organization';

const router = Router();

// GET /api/v1/schedules
router.get('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const schedules = await Schedule.find({ organizationId: org._id.toString() });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// POST /api/v1/schedules
router.post('/', async (req, res) => {
  try {
    const slug = req.headers['x-org-id'] || 'klb-connect';
    const org = await Organization.findOne({ slug });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const schedule = new Schedule({ ...req.body, organizationId: org._id.toString() });
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create schedule' });
  }
});

export default router;
