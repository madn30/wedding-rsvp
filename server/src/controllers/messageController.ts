/**
 * messageController.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles POST /api/messages/send-invitation
 *
 * Accepts { guestId } from the React admin UI.
 * Fetches the invitation template from AppSettings, interpolates it with the
 * guest's data, applies a 1–3 s anti-spam delay, sends via whatsapp-web.js,
 * and updates the guest DB record.
 */

import { Request, Response } from 'express';
import {
  isWhatsAppReady,
  sendWhatsAppMessage,
  randomDelay,
  formatToWhatsAppId,
  buildCalendarLink,
} from '../whatsapp';
import { normalizeIsraeliPhone } from '../services/messagingService';
import { Guest } from '../models/Guest';
import { AppSettings } from '../models/AppSettings';
import { Event as EventModel } from '../models/Event';

function interpolate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// POST /api/messages/send-invitation
export const sendInvitationMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { guestId } = req.body as { guestId?: string };

  if (!guestId) {
    res.status(400).json({ success: false, message: 'guestId is required.' });
    return;
  }

  // ── 1. Client readiness check ─────────────────────────────────────────────
  if (!isWhatsAppReady()) {
    res.status(503).json({
      success: false,
      message:
        'WhatsApp client is not ready. ' +
        'Start the server with WHATSAPP_ENABLED=true and scan the QR code in the terminal.',
    });
    return;
  }

  // ── 2. Fetch guest and active event ───────────────────────────────────────
  const guest = await Guest.findById(guestId);
  if (!guest) {
    res.status(404).json({ success: false, message: 'Guest not found.' });
    return;
  }

  const activeEvent = await EventModel.findOne({ isActive: true });

  // ── 3. Build message from admin template ──────────────────────────────────
  const settings = await AppSettings.getSingleton();
  
  // Dynamically get the frontend URL from the request origin instead of env vars
  const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  const rsvpLink = `${baseUrl}/rsvp/${guest.token}`;
  const coupleNames = activeEvent?.groomName && activeEvent?.brideName
    ? `${activeEvent.brideName} ו${activeEvent.groomName}`
    : activeEvent?.name || 'החתן והכלה';
  // Use active event details, strict fallbacks without environment variables
const messageContent = interpolate(settings.templates.invitation, {
    guest_name: guest.name,
    couple_names: coupleNames,
    wedding_date: activeEvent?.date || 'טרם נקבע תאריך',
    venue: activeEvent?.location || 'טרם נקבע מיקום',
    rsvp_link: rsvpLink,
    calendar_link: buildCalendarLink(activeEvent),
  });

  // ── 4. Phone sanitisation ─────────────────────────────────────────────────
  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeIsraeliPhone(guest.phone);
  } catch {
    res.status(400).json({
      success: false,
      message: `Invalid phone number: "${guest.phone}". Expected format: 0501234567`,
    });
    return;
  }

  // ── 5. Anti-spam delay (1–3 s) ────────────────────────────────────────────
  await randomDelay();

  // ── 6. Send ───────────────────────────────────────────────────────────────
  try {
    await sendWhatsAppMessage(normalizedPhone, messageContent);

    await Guest.findByIdAndUpdate(guestId, {
      $set: {
        messageSent: true,
        messageChannel: 'whatsapp',
        messageSentAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: `WhatsApp message sent to ${normalizedPhone}.`,
      data: { whatsappId: formatToWhatsAppId(normalizedPhone) },
    });
  } catch (err: any) {
    const status =
      err.message?.includes('not registered on WhatsApp') ? 422 : 500;

    res.status(status).json({
      success: false,
      message: err.message || 'Failed to send WhatsApp message.',
    });
  }
};