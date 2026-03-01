/**
 * whatsapp.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Singleton WhatsApp client powered by whatsapp-web.js + LocalAuth.
 *
 * Usage:
 *   1. Call `initWhatsAppClient()` once at server startup.
 *   2. The QR code will be printed to the terminal — scan it with the WhatsApp
 *      Business app on your eSIM device.  The session is then persisted in
 *      .wwebjs_auth/ so you only need to scan once.
 *   3. Call `sendWhatsAppMessage(phone, text)` to send a message.
 *
 * ⚠️  Add `.wwebjs_auth/` to .gitignore — it contains your session credentials.
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
// qrcode-terminal has no official @types package — import via require()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require('qrcode-terminal') as {
  generate: (text: string, opts?: { small?: boolean }) => void;
};

// ── Singleton state ──────────────────────────────────────────────────────────

let client: Client | null = null;
let ready = false;

// ── Initialisation ───────────────────────────────────────────────────────────

/**
 * Initialise the WhatsApp client. Safe to call multiple times — creates the
 * client only once.  Must be called before any message can be sent.
 */
export const initWhatsAppClient = (): void => {
  if (client) return; // already initialised

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth', // session persisted here — add to .gitignore!
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // prevents crashes in limited-memory envs
      ],
    },
  });

  // ── QR code ───────────────────────────────────────────────────────────────
  client.on('qr', (qr: string) => {
    console.log(
      '\n[WhatsApp] New QR code generated.\n' +
        '[WhatsApp] Open WhatsApp Business on your eSIM device →\n' +
        '           Linked Devices → Link a Device → scan the code below:\n'
    );
    qrcode.generate(qr, { small: true });
  });

  // ── Auth events ───────────────────────────────────────────────────────────
  client.on('authenticated', () => {
    console.log('[WhatsApp] Session authenticated — credentials saved to .wwebjs_auth/');
  });

  client.on('auth_failure', (msg: string) => {
    console.error('[WhatsApp] Authentication failed:', msg);
    console.error('[WhatsApp] Delete .wwebjs_auth/ and restart to re-scan the QR.');
    ready = false;
  });

  // ── Ready ─────────────────────────────────────────────────────────────────
  client.on('ready', () => {
    ready = true;
    console.log('[WhatsApp] Client is ready. Messages can now be sent.');
  });

  // ── Disconnection ─────────────────────────────────────────────────────────
  client.on('disconnected', (reason: string) => {
    console.warn('[WhatsApp] Client disconnected:', reason);
    ready = false;
    client = null; // allow re-init if the server re-initialises
  });

  // ── Incoming messages → mark guest as replied ─────────────────────────────
  // This replaces the old Twilio /webhook handler. When a guest replies,
  // we update their `whatsappReplied` flag so the admin can track responses.
  client.on('message', async (msg: { from: string; body: string }) => {
    try {
      const from: string = msg.from; // format: 972501234567@c.us
      if (!from.endsWith('@c.us')) return; // ignore group messages

      // Reconstruct E.164 format: 972XXXXXXXXX → +972XXXXXXXXX
      const normalized = `+${from.replace('@c.us', '')}`;

      // Lazy import avoids circular dependency issues
      const { Guest } = await import('../models/Guest');
      await Guest.findOneAndUpdate(
        { phone: normalized },
        { $set: { whatsappReplied: true } }
      );
      console.log(`[WhatsApp] Incoming reply from ${normalized} — marked as replied.`);
    } catch (err) {
      console.error('[WhatsApp] Error handling incoming message:', err);
    }
  });

  client.initialize();
  console.log('[WhatsApp] Client initialising — waiting for QR scan or cached session…');
};

// ── Public helpers ────────────────────────────────────────────────────────────

/** Returns true once the client has connected and is ready to send. */
export const isWhatsAppReady = (): boolean => ready;

/**
 * Converts an Israeli phone number to the WhatsApp chat-ID format.
 *
 * Accepts:  0501234567 · 501234567 · 972501234567 · +972501234567
 * Returns:  972501234567@c.us
 */
export const formatToWhatsAppId = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  let national: string;
  if (digits.startsWith('972') && digits.length === 12) {
    national = digits; // already in 972XXXXXXXXX form
  } else if (digits.startsWith('05') && digits.length === 10) {
    national = `972${digits.slice(1)}`;
  } else if (digits.startsWith('5') && digits.length === 9) {
    national = `972${digits}`;
  } else {
    throw new Error(
      `Invalid Israeli phone number: "${phone}". ` +
        'Expected formats: 0501234567 / 972501234567 / +972501234567'
    );
  }

  return `${national}@c.us`;
};

/**
 * Safety delay — random pause between 3 and 7 seconds.
 * Use between consecutive sends to avoid WhatsApp spam detection.
 */
export const randomDelay = (): Promise<void> => {
  const ms = 3_000 + Math.floor(Math.random() * 4_001); // 3000–7000 ms
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Send a WhatsApp message to an Israeli phone number.
 *
 * @param phone   Israeli phone in any accepted format (see formatToWhatsAppId)
 * @param message Plain-text message body (supports WhatsApp markdown)
 * @throws        If client not ready, number not on WhatsApp, or send fails
 */
export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<void> => {
  if (!client || !ready) {
    throw new Error(
      '[WhatsApp] Client is not ready. ' +
        'Ensure initWhatsAppClient() was called and the QR code was scanned.'
    );
  }

  const chatId = formatToWhatsAppId(phone);

  // Validate: check the number is actually registered on WhatsApp
  const isRegistered = await client.isRegisteredUser(chatId);
  if (!isRegistered) {
    throw new Error(
      `Phone number ${phone} is not registered on WhatsApp. Message not sent.`
    );
  }

  await client.sendMessage(chatId, message);
};
