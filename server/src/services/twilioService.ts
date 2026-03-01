/**
 * twilioService.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Unified messaging service.
 *
 * • WhatsApp  → routed through whatsapp-web.js (local eSIM, no Twilio needed)
 * • SMS       → still routed through Twilio (requires TWILIO_* env vars)
 *
 * The exported interface (`sendSMS`, `normalizeIsraeliPhone`, `MessageChannel`)
 * is unchanged so guestController.ts requires no modification.
 */

import twilio from 'twilio';
import { sendWhatsAppMessage } from '../utils/whatsapp';

// ── Twilio client (SMS only) ───────────────────────────────────────────────────

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageChannel = 'sms' | 'whatsapp';

interface SendMessageOptions {
  to: string;       // E.164 format, e.g. +972501234567
  name: string;
  rsvpLink: string;
  channel: MessageChannel;
  hasReplied?: boolean; // kept for API compatibility (no longer used for WhatsApp)
}

// ── Message builder ───────────────────────────────────────────────────────────

const buildMessage = (name: string, rsvpLink: string): string => {
  const coupleNames = process.env.COUPLE_NAMES || 'החתן והכלה';
  const weddingDate = process.env.WEDDING_DATE || '';
  const dateText = weddingDate ? ` בתאריך ${weddingDate}` : '';
  return (
    `היי ${name}, אנחנו מזמינים אתכם לחתונה של ${coupleNames}${dateText}!\n` +
    `אנא אשרו הגעה כאן:\n${rsvpLink}`
  );
};

// ── Main send function ────────────────────────────────────────────────────────

/**
 * Send an invitation via WhatsApp (local eSIM) or SMS (Twilio).
 * Returns a message identifier string on success.
 */
export const sendSMS = async (options: SendMessageOptions): Promise<string> => {
  const { to, name, rsvpLink, channel } = options;

  const message = buildMessage(name, rsvpLink);

  // ── WhatsApp path: uses whatsapp-web.js (local eSIM) ─────────────────────
  if (channel === 'whatsapp') {
    await sendWhatsAppMessage(to, message);
    return `whatsapp:${to}`; // no SID — return the recipient as the identifier
  }

  // ── SMS path: uses Twilio ─────────────────────────────────────────────────
  try {
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });
    return result.sid;
  } catch (err: any) {
    if (err.code === 21211) {
      throw new Error(`SMS: invalid phone number format: ${to}`);
    }
    throw err;
  }
};

// ── Phone normalisation ───────────────────────────────────────────────────────

/**
 * Normalises an Israeli phone number to E.164 format (+972XXXXXXXXX).
 * Accepts: 0501234567, 501234567, 972501234567, +972501234567
 */
export const normalizeIsraeliPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('972') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('05') && digits.length === 10) return `+972${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `+972${digits}`;

  throw new Error(`Invalid Israeli phone number: ${phone}`);
};
