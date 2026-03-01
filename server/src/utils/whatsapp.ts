/**
 * whatsapp.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Singleton WhatsApp client powered by whatsapp-web.js + LocalAuth.
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require('qrcode-terminal') as {
  generate: (text: string, opts?: { small?: boolean }) => void;
};

// ── Singleton state ──────────────────────────────────────────────────────────

let client: Client | null = null;
let ready = false;

// ── Initialisation ───────────────────────────────────────────────────────────

export const initWhatsAppClient = (): void => {
  if (client) return; 

  // זיהוי אם אנחנו רצים ב-Render כדי להשתמש בדפדפן המותקן שם
  const isRender = process.env.RENDER === 'true';

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth',
    }),
    puppeteer: {
      headless: true, // חייב להיות true בשרתים
      // ב-Render נשתמש בנתיב המותקן, במחשב נשאיר ל-puppeteer למצוא לבד
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (isRender ? '/usr/bin/google-chrome' : undefined),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--no-zygote',
        '--single-process',
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
    ready = false;
  });

  // ── Ready ─────────────────────────────────────────────────────────────────
  client.on('ready', () => {
    ready = true;
    console.log('[WhatsApp] Client is ready. Messages can now be sent.');
  });

  client.on('disconnected', (reason: string) => {
    console.warn('[WhatsApp] Client disconnected:', reason);
    ready = false;
    client = null; 
  });

  // ── Incoming messages → mark guest as replied ─────────────────────────────
  client.on('message', async (msg: { from: string; body: string }) => {
    try {
      const from: string = msg.from;
      if (!from.endsWith('@c.us')) return; 

      const normalized = `+${from.replace('@c.us', '')}`;

      // Lazy import למניעת Circular Dependency
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

  client.initialize().catch(err => {
    console.error('[WhatsApp] Failed to initialize client:', err);
  });
  
  console.log('[WhatsApp] Client initialising — waiting for QR scan or cached session…');
};

// ── Public helpers ────────────────────────────────────────────────────────────

export const isWhatsAppReady = (): boolean => ready;

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
    throw new Error(`Invalid Israeli phone number: "${phone}"`);
  }

  return `${national}@c.us`;
};

export const randomDelay = (): Promise<void> => {
  const ms = 3_000 + Math.floor(Math.random() * 4_001); 
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<void> => {
  if (!client || !ready) {
    throw new Error('[WhatsApp] Client is not ready.');
  }

  const chatId = formatToWhatsAppId(phone);

  const isRegistered = await client.isRegisteredUser(chatId);
  if (!isRegistered) {
    throw new Error(`Number ${phone} is not on WhatsApp.`);
  }

  await client.sendMessage(chatId, message);
};