/**
 * whatsappController.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Handlers for WhatsApp-related endpoints.
 *
 * NOTE: The old Twilio /webhook handler has been removed. Incoming messages are
 * now handled inside whatsapp.ts via the whatsapp-web.js `message` event,
 * which automatically updates the guest's `whatsappReplied` field.
 */

import { Request, Response } from 'express';
import {
  isWhatsAppReady,
  sendWhatsAppMessage,
  randomDelay,
  formatToWhatsAppId,
} from '../utils/whatsapp';
import { normalizeIsraeliPhone } from '../services/twilioService';

// ── POST /api/send-invitation ─────────────────────────────────────────────────
/**
 * Send a personalised WhatsApp invitation directly by phone + name.
 *
 * Body:
 *   { guestPhone: "0501234567", guestName: "יונתן" }
 *
 * Applies a 3–7 s random safety delay before sending to avoid WhatsApp's
 * anti-spam detection when the endpoint is called in a loop.
 */
export const sendInvitation = async (req: Request, res: Response): Promise<void> => {
  const { guestPhone, guestName } = req.body as {
    guestPhone?: string;
    guestName?: string;
  };

  // ── Input validation ───────────────────────────────────────────────────────
  if (!guestPhone || !guestName) {
    res.status(400).json({
      success: false,
      message: 'guestPhone and guestName are required.',
    });
    return;
  }

  // ── Client readiness check ─────────────────────────────────────────────────
  if (!isWhatsAppReady()) {
    res.status(503).json({
      success: false,
      message:
        'WhatsApp client is not ready. Start the server and scan the QR code in the terminal.',
    });
    return;
  }

  // ── Phone normalisation ────────────────────────────────────────────────────
  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeIsraeliPhone(guestPhone); // → +972XXXXXXXXX
  } catch {
    res.status(400).json({
      success: false,
      message:
        `Invalid Israeli phone number: "${guestPhone}". ` +
        'Expected format: 0501234567 or 972501234567.',
    });
    return;
  }

  // ── Safety delay (anti-spam) ───────────────────────────────────────────────
  await randomDelay();

  // ── Build & send message ───────────────────────────────────────────────────
  const rsvpBaseUrl = process.env.RSVP_BASE_URL || '';
  const rsvpLink = rsvpBaseUrl
    ? `${rsvpBaseUrl}/rsvp` // generic link; use /api/guests/:id/send for token-based links
    : '[קישור RSVP]';

  const message =
    `היי ${guestName}, אנחנו מזמינים אתכם לחתונה שלנו! ` +
    `אנא אשרו הגעה כאן: ${rsvpLink}`;

  try {
    await sendWhatsAppMessage(normalizedPhone, message);

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${guestName} (${normalizedPhone}).`,
      data: {
        whatsappId: formatToWhatsAppId(normalizedPhone),
        messageSent: message,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes('not registered') ? 422 : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Failed to send WhatsApp invitation.',
    });
  }
};

// ── GET /api/whatsapp/status ──────────────────────────────────────────────────
/**
 * Returns whether the WhatsApp client is connected and ready.
 * Useful for a health-check in the admin UI before sending bulk invitations.
 */
export const getStatus = (_req: Request, res: Response): void => {
  const ready = isWhatsAppReady();
  res.status(ready ? 200 : 503).json({
    success: true,
    data: {
      ready,
      message: ready
        ? 'WhatsApp client is connected and ready.'
        : 'WhatsApp client is not ready. Check terminal for QR code.',
    },
  });
};
