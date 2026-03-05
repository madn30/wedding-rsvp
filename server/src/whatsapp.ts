interface CalendarEvent {
  name?: string;
  groomName?: string;
  brideName?: string;
  location?: string;
  date?: string;
  startTime?: string;
}
import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";

const qrcode = require("qrcode-terminal") as {
  generate: (text: string, opts?: { small?: boolean }) => void;
};

export const buildCalendarLink = (event: CalendarEvent | null): string => {
  const coupleNames =
    event?.groomName && event?.brideName
      ? `${event.brideName} ו${event.groomName}`
      : event?.name || "החתן והכלה";

  const title = encodeURIComponent(`חתונת ${coupleNames}`);
  const venue = encodeURIComponent(event?.location || "טרם נקבע מיקום");

  let datesParam = "20260210/20260211";

  if (event?.date && event?.startTime) {
    try {
      let isoDate = event.date;
      if (isoDate.includes(".")) {
        const [d, m, y] = isoDate.split(".");
        isoDate = `${y}-${m}-${d}`;
      } else if (isoDate.includes("/")) {
        const [d, m, y] = isoDate.split("/");
        isoDate = `${y}-${m}-${d}`;
      }

      const startDate = new Date(`${isoDate}T${event.startTime}:00`);
      const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);

      const formatToGoogleCal = (d: Date) => {
        return (
          d.getFullYear().toString() +
          (d.getMonth() + 1).toString().padStart(2, "0") +
          d.getDate().toString().padStart(2, "0") +
          "T" +
          d.getHours().toString().padStart(2, "0") +
          d.getMinutes().toString().padStart(2, "0") +
          "00"
        );
      };

      if (!isNaN(startDate.getTime())) {
        datesParam = `${formatToGoogleCal(startDate)}/${formatToGoogleCal(endDate)}`;
      }
    } catch {}
  }

  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}&dates=${datesParam}&location=${venue}`
  );
};

export const buildWazeLink = (): string => {
  const venue = encodeURIComponent(process.env.WEDDING_VENUE || "כתובת האירוע");
  return `https://www.waze.com/ul?q=${venue}`;
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
        "--single-process", 
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
