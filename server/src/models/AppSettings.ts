/**
 * AppSettings.ts  —  server/src/models/AppSettings.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton document that stores:
 *   • All customisable WhatsApp message templates
 *   • Global RSVP lock flag (manual override by admin)
 *
 * Only ONE document is ever kept in this collection. Use AppSettings.getSingleton()
 * to retrieve (and auto-create) it.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Sub-document interfaces ───────────────────────────────────────────────────

export interface MessageTemplates {
  /** Initial WhatsApp invitation sent per guest */
  invitation: string;
  /** 30-day reminder for guests who haven't responded (Pending) */
  reminder30Pending: string;
  /** 30-day reminder for guests who confirmed (Attending) */
  reminder30Attending: string;
  /** Auto-reply when a guest submits "no" / declines */
  declinedReply: string;
  /** Day-of greeting for confirmed guests */
  dayOf: string;
}

// ── Document interface ────────────────────────────────────────────────────────

export interface IAppSettings extends Document {
  templates: MessageTemplates;
  /** When true, the public RSVP form rejects new submissions */
  rsvpLocked: boolean;
  lockedAt: Date | null;
}

// ── Model interface with static helper ───────────────────────────────────────

interface IAppSettingsModel extends Model<IAppSettings> {
  getSingleton(): Promise<IAppSettings>;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    templates: {
      invitation: {
        type: String,
        default:
          'היי {{guest_name}}, אנחנו שמחים להזמין אותך לחתונה של {{couple_names}}!\n' +
          '📅 {{wedding_date}}\n📍 {{venue}}\n\n' +
          'אנא אשרו הגעה כאן:\n{{rsvp_link}}\n\n' +
          'להוספת האירוע ליומן:\n{{calendar_link}}',
      },
      reminder30Pending: {
        type: String,
        default:
          'היי {{guest_name}}, נזכיר שנשאר רק חודש לחתונה של {{couple_names}}! 🎉\n' +
          'עדיין לא אישרת הגעה — נשמח לדעת:\n{{rsvp_link}}',
      },
      reminder30Attending: {
        type: String,
        default:
          'היי {{guest_name}}, חודש עוד ואנחנו מתחתנים! 🥂\n' +
          'אתם מגיעים ל{{couple_names}} — תודה שאישרתם!\n' +
          'אם יש שינוי בכמות האורחים, עדכנו כאן:\n{{rsvp_link}}',
      },
      declinedReply: {
        type: String,
        default:
          'חבל שלא תוכלו להגיע, {{guest_name}} 💛\n' +
          'תודה שעדכנתם אותנו — נתגעגע אליכם!',
      },
      dayOf: {
        type: String,
        default:
          'היום זה קורה! 🎊\n' +
          'היי {{guest_name}}, מחכים לכם בחתונה של {{couple_names}}!\n' +
          '📍 {{venue}}\n\n' +
          'לניווט עם Waze:\n{{waze_link}}',
      },
    },
    rsvpLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Static: ensure singleton ──────────────────────────────────────────────────

AppSettingsSchema.statics.getSingleton = async function (): Promise<IAppSettings> {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

export const AppSettings = mongoose.model<IAppSettings, IAppSettingsModel>(
  'AppSettings',
  AppSettingsSchema
);
