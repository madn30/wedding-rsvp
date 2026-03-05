import mongoose, { Document, Model, Schema } from "mongoose";

export interface MessageTemplates {
  invitation: string;

  reminder30Pending: string;

  reminder30Attending: string;

  declinedReply: string;

  dayOf: string;
}

export interface IAppSettings extends Document {
  templates: MessageTemplates;

  rsvpLocked: boolean;
  lockedAt: Date | null;
}

interface IAppSettingsModel extends Model<IAppSettings> {
  getSingleton(): Promise<IAppSettings>;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    templates: {
      invitation: {
        type: String,
        default:
          "היי {{guest_name}}, אנחנו שמחים להזמין אותך לחתונה של {{couple_names}}!\n" +
          "📅 {{wedding_date}}\n📍 {{venue}}\n\n" +
          "אנא אשרו הגעה כאן:\n{{rsvp_link}}\n\n" +
          "להוספת האירוע ליומן:\n{{calendar_link}}",
      },
      reminder30Pending: {
        type: String,
        default:
          "היי {{guest_name}}, נזכיר שנשאר רק חודש לחתונה של {{couple_names}}! 🎉\n" +
          "עדיין לא אישרת הגעה — נשמח לדעת:\n{{rsvp_link}}",
      },
      reminder30Attending: {
        type: String,
        default:
          "היי {{guest_name}}, חודש עוד ואנחנו מתחתנים! 🥂\n" +
          "אתם מגיעים ל{{couple_names}} — תודה שאישרתם!\n" +
          "אם יש שינוי בכמות האורחים, עדכנו כאן:\n{{rsvp_link}}",
      },
      declinedReply: {
        type: String,
        default:
          "חבל שלא תוכלו להגיע, {{guest_name}} 💛\n" +
          "תודה שעדכנתם אותנו — נתגעגע אליכם!",
      },
      dayOf: {
        type: String,
        default:
          "היום זה קורה! 🎊\n" +
          "היי {{guest_name}}, מחכים לכם בחתונה של {{couple_names}}!\n" +
          "📍 {{venue}}\n\n" +
          "לניווט עם Waze:\n{{waze_link}}",
      },
    },
    rsvpLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AppSettingsSchema.statics.getSingleton =
  async function (): Promise<IAppSettings> {
    let doc = await this.findOne();
    if (!doc) {
      doc = await this.create({});
    }
    return doc;
  };

export const AppSettings = mongoose.model<IAppSettings, IAppSettingsModel>(
  "AppSettings",
  AppSettingsSchema,
);
