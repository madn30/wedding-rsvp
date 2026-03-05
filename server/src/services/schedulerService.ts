import cron from "node-cron";
import { Guest } from "../models/Guest";
import { AppSettings } from "../models/AppSettings";
import { sendWhatsAppMessage, isWhatsAppReady, randomDelay } from "../whatsapp";

const WEDDING_DATE = new Date("2026-02-10T00:00:00.000+02:00");

const WAZE_BASE =
  "https://www.waze.com/ul?q=" +
  encodeURIComponent(process.env.WEDDING_VENUE || "כתובת האירוע");

interface TemplateVars {
  guest_name: string;
  couple_names: string;
  wedding_date: string;
  venue: string;
  rsvp_link: string;
  calendar_link?: string;
  waze_link?: string;
}

function interpolate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return (
      (vars as unknown as Record<string, string | undefined>)[key] ??
      `{{${key}}}`
    );
  });
}

function buildCalendarLink(): string {
  const title = encodeURIComponent(
    `חתונת ${process.env.COUPLE_NAMES || "החתן והכלה"}`,
  );
  const venue = encodeURIComponent(process.env.WEDDING_VENUE || "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20260210/20260211&location=${venue}`;
}

async function sendToGuest(phone: string, message: string): Promise<void> {
  await randomDelay();
  await sendWhatsAppMessage(phone, message);
}

async function runReminder30(): Promise<void> {
  if (!isWhatsAppReady()) {
    return;
  }

  const settings = await AppSettings.getSingleton();
  const { reminder30Pending, reminder30Attending } = settings.templates;

  const coupleNames = process.env.COUPLE_NAMES || "החתן והכלה";
  const weddingDate = process.env.WEDDING_DATE || "10.02.2026";
  const venue = process.env.WEDDING_VENUE || "";
  const baseUrl = process.env.RSVP_BASE_URL || "";
  const calendarLink = buildCalendarLink();

  const pendingGuests = await Guest.find({ response: null });

  for (const guest of pendingGuests) {
    try {
      const rsvpLink = `${baseUrl}/rsvp/${guest.token}`;
      const message = interpolate(reminder30Pending, {
        guest_name: guest.name,
        couple_names: coupleNames,
        wedding_date: weddingDate,
        venue,
        rsvp_link: rsvpLink,
        calendar_link: calendarLink,
      });
      await sendToGuest(guest.phone, message);
    } catch {}
  }

  const attendingGuests = await Guest.find({ response: "yes" });

  for (const guest of attendingGuests) {
    try {
      const rsvpLink = `${baseUrl}/rsvp/${guest.token}`;
      const message = interpolate(reminder30Attending, {
        guest_name: guest.name,
        couple_names: coupleNames,
        wedding_date: weddingDate,
        venue,
        rsvp_link: rsvpLink,
        calendar_link: calendarLink,
      });
      await sendToGuest(guest.phone, message);
    } catch {}
  }
}

async function runDayOfGreeting(): Promise<void> {
  if (!isWhatsAppReady()) {
    return;
  }

  const settings = await AppSettings.getSingleton();
  const { dayOf } = settings.templates;

  const coupleNames = process.env.COUPLE_NAMES || "החתן והכלה";
  const weddingDate = process.env.WEDDING_DATE || "10.02.2026";
  const venue = process.env.WEDDING_VENUE || "";

  const attendingGuests = await Guest.find({ response: "yes" });

  for (const guest of attendingGuests) {
    try {
      const message = interpolate(dayOf, {
        guest_name: guest.name,
        couple_names: coupleNames,
        wedding_date: weddingDate,
        venue,
        rsvp_link: `${process.env.RSVP_BASE_URL || ""}/rsvp/${guest.token}`,
        waze_link: WAZE_BASE,
      });
      await sendToGuest(guest.phone, message);
    } catch {}
  }
}

async function runDailyLockCheck(): Promise<void> {
  const now = new Date();
  if (now < WEDDING_DATE) return;

  const settings = await AppSettings.getSingleton();
  if (settings.rsvpLocked) return;

  settings.rsvpLocked = true;
  settings.lockedAt = now;
  await settings.save();
}

export function initScheduler(): void {
  cron.schedule("0 7 11 1 *", () => {
    runReminder30().catch(() => {});
  });

  cron.schedule("0 7 10 2 *", () => {
    runDayOfGreeting().catch(() => {});
  });

  cron.schedule("1 0 * * *", () => {
    runDailyLockCheck().catch(() => {});
  });
}

export { runReminder30, runDayOfGreeting };
