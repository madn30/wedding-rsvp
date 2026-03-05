import cron from "node-cron";
import { Guest } from "../models/Guest";
import { AppSettings } from "../models/AppSettings";
import { Event as EventModel } from "../models/Event";
import { sendWhatsAppMessage, isWhatsAppReady, randomDelay } from "../whatsapp";

async function getActiveEventData() {
  const event = await EventModel.findOne({ isActive: true });
  if (!event) return null;

  const coupleNames =
    event.groomName && event.brideName
      ? `${event.groomName} & ${event.brideName}`
      : event.name;

  return {
    coupleNames,
    weddingDate: event.date,
    venue: event.location,
    raw: event,
  };
}

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

function buildCalendarLink(
  coupleNames: string,
  date: string,
  venue: string,
): string {
  const title = encodeURIComponent(`חתונת ${coupleNames}`);
  const location = encodeURIComponent(venue);

  const dateStr = new Date(date)
    .toISOString()
    .replace(/-|:|\.\d+/g, "")
    .split("T")[0];

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&location=${location}`;
}

async function sendToGuest(phone: string, message: string): Promise<void> {
  await randomDelay();
  await sendWhatsAppMessage(phone, message);
}

async function runReminder30(): Promise<void> {
  const eventData = await getActiveEventData();
  if (!isWhatsAppReady() || !eventData) return;

  const settings = await AppSettings.getSingleton();
  const { reminder30Pending, reminder30Attending } = settings.templates;
  const baseUrl = process.env.RSVP_BASE_URL || "";
  const calendarLink = buildCalendarLink(
    eventData.coupleNames,
    eventData.weddingDate,
    eventData.venue,
  );

  const pendingGuests = await Guest.find({ response: null });
  for (const guest of pendingGuests) {
    try {
      const message = interpolate(reminder30Pending, {
        guest_name: guest.name,
        couple_names: eventData.coupleNames,
        wedding_date: eventData.weddingDate,
        venue: eventData.venue,
        rsvp_link: `${baseUrl}/rsvp/${guest.token}`,
        calendar_link: calendarLink,
      });
      await sendToGuest(guest.phone, message);
    } catch {}
  }

  const attendingGuests = await Guest.find({ response: "yes" });
  for (const guest of attendingGuests) {
    try {
      const message = interpolate(reminder30Attending, {
        guest_name: guest.name,
        couple_names: eventData.coupleNames,
        wedding_date: eventData.weddingDate,
        venue: eventData.venue,
        rsvp_link: `${baseUrl}/rsvp/${guest.token}`,
        calendar_link: calendarLink,
      });
      await sendToGuest(guest.phone, message);
    } catch {}
  }
}

async function runDayOfGreeting(): Promise<void> {
  const eventData = await getActiveEventData();
  if (!isWhatsAppReady() || !eventData) return;

  const settings = await AppSettings.getSingleton();
  const { dayOf } = settings.templates;
  const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(eventData.venue)}`;

  const attendingGuests = await Guest.find({ response: "yes" });

  for (const guest of attendingGuests) {
    try {
      const message = interpolate(dayOf, {
        guest_name: guest.name,
        couple_names: eventData.coupleNames,
        wedding_date: eventData.weddingDate,
        venue: eventData.venue,
        rsvp_link: `${process.env.RSVP_BASE_URL || ""}/rsvp/${guest.token}`,
        waze_link: wazeLink,
      });
      await sendToGuest(guest.phone, message);
    } catch {}
  }
}

async function runDailyLockCheck(): Promise<void> {
  const eventData = await getActiveEventData();
  if (!eventData) return;

  const now = new Date();
  const weddingDate = new Date(eventData.weddingDate);

  if (now < weddingDate) return;

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
