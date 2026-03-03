/**
 * settingsController.ts  —  server/src/controllers/settingsController.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin endpoints for:
 *   • Reading / updating all message templates
 *   • Toggling RSVP lock (manual override)
 *   • Triggering scheduled jobs manually
 */

import { Request, Response } from 'express';
import { AppSettings } from '../models/AppSettings';
import { asyncHandler } from '../utils/helpers';
import { runReminder30, runDayOfGreeting } from '../services/schedulerService';

// GET /api/settings
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await AppSettings.getSingleton();
  res.status(200).json({ success: true, data: settings });
});

// PUT /api/settings/templates
// Body: Partial<MessageTemplates>
export const updateTemplates = asyncHandler(async (req: Request, res: Response) => {
  const {
    invitation,
    reminder30Pending,
    reminder30Attending,
    declinedReply,
    dayOf,
  } = req.body as Record<string, string | undefined>;

  const settings = await AppSettings.getSingleton();

  if (invitation !== undefined)        settings.templates.invitation        = invitation;
  if (reminder30Pending !== undefined) settings.templates.reminder30Pending = reminder30Pending;
  if (reminder30Attending !== undefined) settings.templates.reminder30Attending = reminder30Attending;
  if (declinedReply !== undefined)     settings.templates.declinedReply     = declinedReply;
  if (dayOf !== undefined)             settings.templates.dayOf             = dayOf;

  // Mark nested object as modified so Mongoose detects the change
  settings.markModified('templates');
  await settings.save();

  res.status(200).json({ success: true, data: settings });
});

// POST /api/settings/lock
// Body: { locked: boolean }
export const setRsvpLock = asyncHandler(async (req: Request, res: Response) => {
  const { locked } = req.body as { locked: boolean };

  if (typeof locked !== 'boolean') {
    res.status(400).json({ success: false, message: '`locked` must be a boolean.' });
    return;
  }

  const settings = await AppSettings.getSingleton();
  settings.rsvpLocked = locked;
  settings.lockedAt = locked ? new Date() : null;
  await settings.save();

  res.status(200).json({
    success: true,
    message: locked ? 'RSVP forms are now locked.' : 'RSVP forms are now unlocked.',
    data: { rsvpLocked: settings.rsvpLocked, lockedAt: settings.lockedAt },
  });
});

// POST /api/settings/trigger/reminder30
export const triggerReminder30 = asyncHandler(async (_req: Request, res: Response) => {
  // Fire-and-forget: respond immediately, run in background
  runReminder30().catch((err) =>
    console.error('[Settings] Manual reminder30 error:', err)
  );
  res.status(202).json({
    success: true,
    message: 'Reminder job started in background. Check server logs for progress.',
  });
});

// POST /api/settings/trigger/dayof
export const triggerDayOf = asyncHandler(async (_req: Request, res: Response) => {
  runDayOfGreeting().catch((err) =>
    console.error('[Settings] Manual day-of greeting error:', err)
  );
  res.status(202).json({
    success: true,
    message: 'Day-of greeting job started in background.',
  });
});
