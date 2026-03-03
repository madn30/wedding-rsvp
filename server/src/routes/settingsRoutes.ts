/**
 * settingsRoutes.ts  —  server/src/routes/settingsRoutes.ts
 * Mounted at /api/settings in server.ts (all routes require admin auth).
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  getSettings,
  updateTemplates,
  setRsvpLock,
  triggerReminder30,
  triggerDayOf,
} from '../controllers/settingsController';

const router = Router();

// All settings routes are admin-only
router.use(protect);

// GET  /api/settings          — fetch all settings (templates + lock state)
router.get('/', getSettings);

// PUT  /api/settings/templates — update message templates
router.put('/templates', updateTemplates);

// POST /api/settings/lock      — { locked: true|false }
router.post('/lock', setRsvpLock);

// POST /api/settings/trigger/reminder30  — manually fire 30-day reminder
router.post('/trigger/reminder30', triggerReminder30);

// POST /api/settings/trigger/dayof       — manually fire day-of greeting
router.post('/trigger/dayof', triggerDayOf);

export default router;
