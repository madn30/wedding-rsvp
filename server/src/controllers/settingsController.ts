import { Request, Response } from "express";
import { AppSettings } from "../models/AppSettings";
import { asyncHandler } from "../utils/helpers";
import { runReminder30, runDayOfGreeting } from "../services/schedulerService";

export const getSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.getSingleton();
    res.status(200).json({ success: true, data: settings });
  },
);

export const updateTemplates = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      invitation,
      reminder30Pending,
      reminder30Attending,
      declinedReply,
      dayOf,
    } = req.body as Record<string, string | undefined>;

    const settings = await AppSettings.getSingleton();

    if (invitation !== undefined) settings.templates.invitation = invitation;
    if (reminder30Pending !== undefined)
      settings.templates.reminder30Pending = reminder30Pending;
    if (reminder30Attending !== undefined)
      settings.templates.reminder30Attending = reminder30Attending;
    if (declinedReply !== undefined)
      settings.templates.declinedReply = declinedReply;
    if (dayOf !== undefined) settings.templates.dayOf = dayOf;

    settings.markModified("templates");
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  },
);

export const setRsvpLock = asyncHandler(async (req: Request, res: Response) => {
  const { locked } = req.body as { locked: boolean };

  if (typeof locked !== "boolean") {
    res
      .status(400)
      .json({ success: false, message: "`locked` must be a boolean." });
    return;
  }

  const settings = await AppSettings.getSingleton();
  settings.rsvpLocked = locked;
  settings.lockedAt = locked ? new Date() : null;
  await settings.save();

  res.status(200).json({
    success: true,
    message: locked
      ? "RSVP forms are now locked."
      : "RSVP forms are now unlocked.",
    data: { rsvpLocked: settings.rsvpLocked, lockedAt: settings.lockedAt },
  });
});

export const triggerReminder30 = asyncHandler(
  async (_req: Request, res: Response) => {
    runReminder30().catch(() => {});
    res.status(202).json({
      success: true,
      message:
        "Reminder job started in background. Check server logs for progress.",
    });
  },
);

export const triggerDayOf = asyncHandler(
  async (_req: Request, res: Response) => {
    runDayOfGreeting().catch(() => {});
    res.status(202).json({
      success: true,
      message: "Day-of greeting job started in background.",
    });
  },
);
