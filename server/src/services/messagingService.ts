/**
 * messagingService.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Twilio-free messaging layer. All outbound messages go through the local
 * whatsapp-web.js client connected to your eSIM device.
 *
 * Exports the same `normalizeIsraeliPhone` and `MessageChannel` that
 * guestController.ts depends on — so that file needs only one import change.
 */

import { sendWhatsAppMessage, randomDelay } from '../whatsapp';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Only WhatsApp is supported — SMS via Twilio has been removed. */
export type MessageChannel = 'whatsapp';

export interface SendInviteOptions {
  to: string;       // E.164 format: +972XXXXXXXXX
  name: string;
  rsvpLink: string;
}

// ── Message builder ───────────────────────────────────────────────────────────

const buildInviteMessage = (name: string, rsvpLink: string): string => {
  const coupleNames = process.env.COUPLE_NAMES || 'החתן והכלה';
  const weddingDate = process.env.WEDDING_DATE || '';
  const dateText = weddingDate ? ` בתאריך ${weddingDate}` : '';

  return (
    `היי ${name}, אנחנו מזמינים אתכם לחתונה של ${coupleNames}${dateText}!\n` +
    `אנא אשרו הגעה כאן:\n${rsvpLink}`
  );
};

// ── Send ──────────────────────────────────────────────────────────────────────

/**
 * Build an invitation message from the guest's name + RSVP link and send it
 * via the local WhatsApp client.  Applies a random anti-spam delay.
 */
export const sendInvite = async (options: SendInviteOptions): Promise<void> => {
  const { to, name, rsvpLink } = options;
  const message = buildInviteMessage(name, rsvpLink);
  await randomDelay();
  await sendWhatsAppMessage(to, message);
};

// ── Phone normalisation ───────────────────────────────────────────────────────

/**
 * Normalise an Israeli phone number to E.164 (+972XXXXXXXXX).
 * Accepts: 0501234567 · 501234567 · 972501234567 · +972501234567
 */
export const normalizeIsraeliPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('972') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('05') && digits.length === 10) return `+972${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `+972${digits}`;

  throw new Error(`Invalid Israeli phone number: ${phone}`);
};
