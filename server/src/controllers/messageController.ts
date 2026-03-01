/**
 * messageController.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles POST /api/messages/send-invitation
 *
 * Accepts { phoneNumber, messageContent, guestId? } from the React admin UI.
 * Validates input, applies a 1–3 s anti-spam delay, sends via whatsapp-web.js,
 * and optionally updates the guest DB record if guestId is supplied.
 */

import { Request, Response } from 'express';
import {
  isWhatsAppReady,
  sendWhatsAppMessage,
  randomDelay,
  formatToWhatsAppId,
} from '../whatsapp';
import { normalizeIsraeliPhone } from '../services/messagingService';
import { Guest } from '../models/Guest';

// POST /api/messages/send-invitation
export const sendInvitationMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { phoneNumber, messageContent, guestId } = req.body as {
    phoneNumber?: string;
    messageContent?: string;
    guestId?: string;
  };

  // ── 1. Input validation ───────────────────────────────────────────────────
  if (!phoneNumber || !messageContent) {
    res.status(400).json({
      success: false,
      message: 'phoneNumber and messageContent are required.',
    });
    return;
  }

  // ── 2. Client readiness check ─────────────────────────────────────────────
  if (!isWhatsAppReady()) {
    res.status(503).json({
      success: false,
      message:
        'WhatsApp client is not ready. ' +
        'Start the server with WHATSAPP_ENABLED=true and scan the QR code in the terminal.',
    });
    return;
  }

  // ── 3. Phone sanitisation ─────────────────────────────────────────────────
  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeIsraeliPhone(phoneNumber); // → +972XXXXXXXXX
  } catch {
    res.status(400).json({
      success: false,
      message: `Invalid phone number: "${phoneNumber}". Expected format: 0501234567`,
    });
    return;
  }

  // ── 4. Anti-spam delay (1–3 s) ────────────────────────────────────────────
  await randomDelay();

  // ── 5. Send ───────────────────────────────────────────────────────────────
  try {
    await sendWhatsAppMessage(normalizedPhone, messageContent);

    // ── 6. Optionally update the guest DB record ───────────────────────────
    if (guestId) {
      await Guest.findByIdAndUpdate(guestId, {
        $set: {
          messageSent: true,
          messageChannel: 'whatsapp',
          messageSentAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `WhatsApp message sent to ${normalizedPhone}.`,
      data: { whatsappId: formatToWhatsAppId(normalizedPhone) },
    });
  } catch (err: any) {
    // 422 = number exists but isn't on WhatsApp; 500 = all other errors
    const status =
      err.message?.includes('not registered on WhatsApp') ? 422 : 500;

    res.status(status).json({
      success: false,
      message: err.message || 'Failed to send WhatsApp message.',
    });
  }
};
