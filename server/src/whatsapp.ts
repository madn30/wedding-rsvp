import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";

const qrcode = require("qrcode-terminal") as {
  generate: (text: string, opts?: { small?: boolean }) => void;
};

let client: Client | null = null;
let ready = false;

export const initWhatsAppClient = (): void => {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, "../.wwebjs_auth"),
    }),
    puppeteer: {
      executablePath: process.env.CHROME_PATH || undefined,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
        "--disable-extensions",
        "--disable-web-security",
      ],
    },
  });

  client.on("qr", (qr: string) => {
    qrcode.generate(qr, { small: true });

    const encodedQr = encodeURIComponent(qr);
    const browserUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedQr}&size=300x300`;
    console.info(browserUrl);
  });

  client.on("ready", () => {
    ready = true;
    console.info("✅ WhatsApp Client is ready!");
  });

  client.on("authenticated", () => {
    console.info("📩 Authenticated successfully!");
  });

  client.on("auth_failure", (msg) => {
    ready = false;
    console.info("❌ Auth failure:", msg);
  });

  client.on("disconnected", () => {
    ready = false;
    client = null;
  });

  client.on("message", async (msg: { from: string; body: string }) => {
    try {
      const from: string = msg.from;
      if (!from.endsWith("@c.us")) return;

      const normalized = `+${from.replace("@c.us", "")}`;
      const { Guest } = await import("./models/Guest");
      await Guest.findOneAndUpdate(
        { phone: normalized },
        { $set: { whatsappReplied: true } },
      );
    } catch {}
  });

  client.initialize().catch((err) => {
    console.error("🔥 WhatsApp Initialization Failed:", err);
    ready = false;
    client = null;
  });
};

export const isWhatsAppReady = (): boolean => ready;

export const formatToWhatsAppId = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  let national: string;
  if (digits.startsWith("972") && digits.length === 12) {
    national = digits;
  } else if (digits.startsWith("05") && digits.length === 10) {
    national = `972${digits.slice(1)}`;
  } else if (digits.startsWith("5") && digits.length === 9) {
    national = `972${digits}`;
  } else {
    throw new Error(`Invalid Israeli phone number: "${phone}".`);
  }
  return `${national}@c.us`;
};

export const randomDelay = (): Promise<void> => {
  const ms = 1_000 + Math.floor(Math.random() * 2_001);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
): Promise<void> => {
  if (!client || !ready) {
    throw new Error("WhatsApp client is not ready.");
  }

  const chatId = formatToWhatsAppId(phone);

  const isRegistered = await client.isRegisteredUser(chatId);
  if (!isRegistered) {
    throw new Error(`${phone} is not registered on WhatsApp.`);
  }

  await client.sendMessage(chatId, message);
};

export const sendDeclinedReply = async (
  phone: string,
  guestName: string,
  template?: string,
): Promise<void> => {
  const message = (
    template ||
    "חבל שלא תוכלו להגיע, {{guest_name}} 💛\nתודה שעדכנתם אותנו — נתגעגע אליכם!"
  ).replace(/\{\{guest_name\}\}/g, guestName);

  await randomDelay();
  await sendWhatsAppMessage(phone, message);
};
