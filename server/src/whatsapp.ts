/**
 * whatsapp.ts  —  server/src/whatsapp.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Singleton WhatsApp client powered by whatsapp-web.js + LocalAuth.
 * No Twilio dependency — messages are sent through your local eSIM device.
 *
 * First-run:
 *   Start the server with WHATSAPP_ENABLED=true.  A QR code will print to the
 *   terminal.  Scan it with WhatsApp Business → Linked Devices → Link a Device.
 *   The session is saved to .wwebjs_auth/ and reused on subsequent starts.
 *
 * ⚠️  .wwebjs_auth/ and .wwebjs_cache/ are already in .gitignore.
 *     Never commit them — they contain your session credentials.
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
// qrcode-terminal ships without @types — use a typed require()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require('qrcode-terminal') as {
  generate: (text: string, opts?: { small?: boolean }) => void;
};

// ── Singleton state ───────────────────────────────────────────────────────────

let client: Client | null = null;
let ready = false;

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Initialise the WhatsApp client once.
 * Call from server.ts only when WHATSAPP_ENABLED=true.
 */
export const initWhatsAppClient = (): void => {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',        // ← add this
        '--no-zygote',             // ← add this
      ],
    },
  });

  // ── QR code (first run / session expired) ────────────────────────────────
  client.on('qr', (qr: string) => {
    console.log('\n[WhatsApp] QR code ready — scan with WhatsApp Business on your eSIM:\n');
    qrcode.generate(qr, { small: true });
  });

  // ── Auth events ───────────────────────────────────────────────────────────
  client.on('authenticated', () => {
    console.log('[WhatsApp] ✅ Session authenticated — saved to .wwebjs_auth/');
  });

  client.on('auth_failure', (msg: string) => {
    console.error('[WhatsApp] ❌ Authentication failed:', msg);
    console.error('[WhatsApp]    Delete .wwebjs_auth/ and restart to re-scan.');
    ready = false;
  });

  // ── Ready ─────────────────────────────────────────────────────────────────
  client.on('ready', () => {
    ready = true;
    console.log('[WhatsApp] ✅ Client is Ready — messages can now be sent.');
  });

  // ── Disconnection ─────────────────────────────────────────────────────────
  client.on('disconnected', (reason: string) => {
    console.warn('[WhatsApp] ⚠️  Disconnected:', reason);
    ready = false;
    client = null;
  });

  // ── Incoming guest replies → mark whatsappReplied in DB ──────────────────
  client.on('message', async (msg: { from: string; body: string }) => {
    try {
      const from: string = msg.from;
      if (!from.endsWith('@c.us')) return; // skip groups / status

      const normalized = `+${from.replace('@c.us', '')}`;
      // Lazy import avoids circular dependency issues at module-load time
      const { Guest } = await import('./models/Guest');
      await Guest.findOneAndUpdate(
        { phone: normalized },
        { $set: { whatsappReplied: true } }
      );
      console.log(`[WhatsApp] 📩 Reply from ${normalized} — whatsappReplied set.`);
    } catch (err) {
      console.error('[WhatsApp] Error handling incoming message:', err);
    }
  });

  // initialize() is async — catch rejections so they never kill the process
  // (e.g. Chrome not found on the host machine)
  client.initialize().catch((err: Error) => {
    console.error('[WhatsApp] ❌ Failed to launch browser:', err.message);
    console.warn('[WhatsApp]    Ensure Chrome/Chromium is installed, or run locally.');
    ready = false;
    client = null;
  });

  console.log('[WhatsApp] Client initialising — waiting for QR scan or cached session…');
};

// ── Exported helpers ──────────────────────────────────────────────────────────

/** true once the client has connected and the `ready` event has fired. */
export const isWhatsAppReady = (): boolean => ready;

/**
 * Converts an Israeli phone number to a WhatsApp chat ID.
 *
 * Accepts : 0501234567 · 501234567 · 972501234567 · +972501234567
 * Returns : 972501234567@c.us
 */
export const formatToWhatsAppId = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  let national: string;
  if (digits.startsWith('972') && digits.length === 12) {
    national = digits;
  } else if (digits.startsWith('05') && digits.length === 10) {
    national = `972${digits.slice(1)}`;
  } else if (digits.startsWith('5') && digits.length === 9) {
    national = `972${digits}`;
  } else {
    throw new Error(
      `Invalid Israeli phone number: "${phone}". ` +
        'Accepted: 0501234567 / 972501234567 / +972501234567'
    );
  }
  return `${national}@c.us`;
};

/**
 * Random delay: 1–3 seconds (per the spec) to mimic human typing behaviour
 * and avoid WhatsApp's outbound spam detection.
 */
export const randomDelay = (): Promise<void> => {
  const ms = 1_000 + Math.floor(Math.random() * 2_001); // 1000–3000 ms
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Send a plain-text WhatsApp message to an Israeli number.
 *
 * @throws if the client isn't ready, the number isn't on WhatsApp, or send fails.
 */
export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<void> => {
  if (!client || !ready) {
    throw new Error(
      'WhatsApp client is not ready. ' +
        'Set WHATSAPP_ENABLED=true and scan the QR code in the terminal.'
    );
  }

  const chatId = formatToWhatsAppId(phone);

  // Confirm the number is actually registered on WhatsApp before sending
  const isRegistered = await client.isRegisteredUser(chatId);
  if (!isRegistered) {
    throw new Error(`${phone} is not registered on WhatsApp.`);
  }

  await client.sendMessage(chatId, message);
};
