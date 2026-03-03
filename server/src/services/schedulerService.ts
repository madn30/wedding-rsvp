/**
 * schedulerService.ts  —  server/src/services/schedulerService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Background scheduler using node-cron.
 *
 * Jobs:
 *   1. 30-Day Reminder  — Jan 11 2026, 09:00
 *      • Pending guests  → reminder with "RSVP Now" link
 *      • Attending guests → "One month to go!" message with edit link
 *
 *   2. Day-of Greeting  — Feb 10 2026, 09:00
 *      • Attending guests only → greeting + Waze navigation button
 *
 *   3. Daily Lock Check — 00:01 every day
 *      • After the wedding date, auto-lock RSVP (sets rsvpLocked = true)
 *
 * Templates support {{placeholders}} replaced at send time.
 */

import cron from 'node-cron';
import { Guest } from '../models/Guest';
import { AppSettings } from '../models/AppSettings';
import { sendWhatsAppMessage, isWhatsAppReady, randomDelay } from '../whatsapp';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Wedding date for auto-lock and day-of greeting */
const WEDDING_DATE = new Date('2026-02-10T00:00:00.000+02:00');

const WAZE_BASE =
  'https://www.waze.com/ul?q=' +
  encodeURIComponent(process.env.WEDDING_VENUE || 'כתובת האירוע');

// ── Template interpolation ────────────────────────────────────────────────────

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
    return (vars as unknown as Record<string, string | undefined>)[key] ?? `{{${key}}}`;
  });
}

// ── Google Calendar link helper ───────────────────────────────────────────────

function buildCalendarLink(): string {
  const title = encodeURIComponent(`חתונת ${process.env.COUPLE_NAMES || 'החתן והכלה'}`);
  const venue = encodeURIComponent(process.env.WEDDING_VENUE || '');
  // Feb 10 2026 — all-day event
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20260210/20260211&location=${venue}`;
}

// ── Send helper ───────────────────────────────────────────────────────────────

async function sendToGuest(phone: string, message: string): Promise<void> {
  await randomDelay();
  await sendWhatsAppMessage(phone, message);
}

// ── Job implementations ───────────────────────────────────────────────────────

async function runReminder30(): Promise<void> {
  if (!isWhatsAppReady()) {
    console.warn('[Scheduler] 30-day reminder skipped — WhatsApp not ready.');
    return;
  }

  const settings = await AppSettings.getSingleton();
  const { reminder30Pending, reminder30Attending } = settings.templates;

  const coupleNames = process.env.COUPLE_NAMES || 'החתן והכלה';
  const weddingDate = process.env.WEDDING_DATE || '10.02.2026';
  const venue = process.env.WEDDING_VENUE || '';
  const baseUrl = process.env.RSVP_BASE_URL || '';
  const calendarLink = buildCalendarLink();

  // Pending guests
  const pendingGuests = await Guest.find({ response: null });
  console.log(`[Scheduler] 30-day reminder: ${pendingGuests.length} pending guests`);

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
      console.log(`[Scheduler] Sent 30-day pending reminder to ${guest.name}`);
    } catch (err) {
      console.error(`[Scheduler] Failed for ${guest.name}:`, err);
    }
  }

  // Attending guests
  const attendingGuests = await Guest.find({ response: 'yes' });
  console.log(`[Scheduler] 30-day reminder: ${attendingGuests.length} attending guests`);

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
      console.log(`[Scheduler] Sent 30-day attending reminder to ${guest.name}`);
    } catch (err) {
      console.error(`[Scheduler] Failed for ${guest.name}:`, err);
    }
  }
}

async function runDayOfGreeting(): Promise<void> {
  if (!isWhatsAppReady()) {
    console.warn('[Scheduler] Day-of greeting skipped — WhatsApp not ready.');
    return;
  }

  const settings = await AppSettings.getSingleton();
  const { dayOf } = settings.templates;

  const coupleNames = process.env.COUPLE_NAMES || 'החתן והכלה';
  const weddingDate = process.env.WEDDING_DATE || '10.02.2026';
  const venue = process.env.WEDDING_VENUE || '';

  const attendingGuests = await Guest.find({ response: 'yes' });
  console.log(`[Scheduler] Day-of greeting: ${attendingGuests.length} attending guests`);

  for (const guest of attendingGuests) {
    try {
      const message = interpolate(dayOf, {
        guest_name: guest.name,
        couple_names: coupleNames,
        wedding_date: weddingDate,
        venue,
        rsvp_link: `${process.env.RSVP_BASE_URL || ''}/rsvp/${guest.token}`,
        waze_link: WAZE_BASE,
      });
      await sendToGuest(guest.phone, message);
      console.log(`[Scheduler] Sent day-of greeting to ${guest.name}`);
    } catch (err) {
      console.error(`[Scheduler] Failed for ${guest.name}:`, err);
    }
  }
}

async function runDailyLockCheck(): Promise<void> {
  const now = new Date();
  if (now < WEDDING_DATE) return; // not yet

  const settings = await AppSettings.getSingleton();
  if (settings.rsvpLocked) return; // already locked

  settings.rsvpLocked = true;
  settings.lockedAt = now;
  await settings.save();
  console.log('[Scheduler] RSVP auto-locked: wedding date has passed.');
}

// ── Scheduler init ────────────────────────────────────────────────────────────

export function initScheduler(): void {
  // 30-day reminder — Jan 11 2026 at 09:00 (Israeli time, UTC+2)
  // cron: minute hour day month weekday
  cron.schedule('0 7 11 1 *', () => {
    console.log('[Scheduler] Running 30-day reminder job...');
    runReminder30().catch((err) =>
      console.error('[Scheduler] 30-day reminder error:', err)
    );
  });

  // Day-of greeting — Feb 10 2026 at 09:00 (UTC+2 = 07:00 UTC)
  cron.schedule('0 7 10 2 *', () => {
    console.log('[Scheduler] Running day-of greeting job...');
    runDayOfGreeting().catch((err) =>
      console.error('[Scheduler] Day-of greeting error:', err)
    );
  });

  // Daily auto-lock check at 00:01
  cron.schedule('1 0 * * *', () => {
    runDailyLockCheck().catch((err) =>
      console.error('[Scheduler] Lock check error:', err)
    );
  });

  console.log('[Scheduler] ✅ Cron jobs registered: 30-day reminder, day-of greeting, auto-lock.');
}

// ── Manual trigger exports (for admin API) ────────────────────────────────────

export { runReminder30, runDayOfGreeting };
