/**
 * MessageCenterPage.tsx
 * Admin page for:
 *   • Editing all WhatsApp message templates (Feature 4)
 *   • Manual RSVP lock override (Feature 4)
 *   • Viewing scheduler status and triggering jobs manually
 */

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Lock,
  Unlock,
  Bell,
  CalendarCheck,
  Save,
  Play,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSettings,
  updateTemplates,
  setRsvpLock,
  triggerReminder30,
  triggerDayOf,
  MessageTemplates,
  AppSettings,
} from '../services/settingsService';

// ── Template field descriptor ─────────────────────────────────────────────────

interface TemplateField {
  key: keyof MessageTemplates;
  label: string;
  description: string;
  icon: React.ReactNode;
  placeholders: string[];
}

const TEMPLATE_FIELDS: TemplateField[] = [
  {
    key: 'invitation',
    label: 'הזמנה ראשונית',
    description: 'נשלחת לאורח בעת שליחת ההזמנה הראשונה',
    icon: <MessageSquare size={16} />,
    placeholders: ['{{guest_name}}', '{{couple_names}}', '{{wedding_date}}', '{{venue}}', '{{rsvp_link}}', '{{calendar_link}}'],
  },
  {
    key: 'reminder30Pending',
    label: 'תזכורת 30 יום — ממתינים',
    description: 'נשלחת ב-11 בינואר 2026 לאורחים שטרם השיבו',
    icon: <Bell size={16} />,
    placeholders: ['{{guest_name}}', '{{couple_names}}', '{{rsvp_link}}'],
  },
  {
    key: 'reminder30Attending',
    label: 'תזכורת 30 יום — מגיעים',
    description: 'נשלחת ב-11 בינואר 2026 לאורחים שאישרו הגעה',
    icon: <Bell size={16} />,
    placeholders: ['{{guest_name}}', '{{couple_names}}', '{{rsvp_link}}'],
  },
  {
    key: 'declinedReply',
    label: 'מענה אוטומטי לדחייה',
    description: 'נשלח אוטומטית כשאורח לוחץ "לא מגיע"',
    icon: <MessageSquare size={16} />,
    placeholders: ['{{guest_name}}'],
  },
  {
    key: 'dayOf',
    label: 'ברכת יום האירוע',
    description: 'נשלחת ב-10 בפברואר 2026 לאורחים שאישרו הגעה — כולל ניווט Waze',
    icon: <CalendarCheck size={16} />,
    placeholders: ['{{guest_name}}', '{{couple_names}}', '{{venue}}', '{{waze_link}}'],
  },
];

// ── Template editor card ──────────────────────────────────────────────────────

interface TemplateCardProps {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
}

const TemplateCard = ({ field, value, onChange }: TemplateCardProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#0d1b2a]/80 border border-[#c9a84c]/15 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#c9a84c]">{field.icon}</span>
          <div className="text-right">
            <p className="text-[#faf6ef] font-semibold text-sm">{field.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{field.description}</p>
          </div>
        </div>
        <span className="text-white/30">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-3">
          {/* Placeholder hints */}
          <div className="flex flex-wrap gap-2">
            {field.placeholders.map((p) => (
              <button
                key={p}
                onClick={() => onChange(value + p)}
                className="text-[10px] font-mono bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 rounded px-2 py-0.5 hover:bg-[#c9a84c]/20 transition-colors"
                title="לחץ להוסיף"
              >
                {p}
              </button>
            ))}
            <span className="text-white/20 text-[10px] flex items-center gap-1">
              <Info size={10} /> לחץ להוסיף
            </span>
          </div>

          <textarea
            dir="auto"
            rows={6}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#060a11] border border-white/10 rounded-xl px-4 py-3 text-[#faf6ef] text-sm leading-relaxed resize-none focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/20 transition-all placeholder-white/20 font-mono"
            placeholder="הקלד את תוכן ההודעה..."
          />
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const MessageCenterPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [templates, setTemplates] = useState<MessageTemplates>({
    invitation: '',
    reminder30Pending: '',
    reminder30Attending: '',
    declinedReply: '',
    dayOf: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setTemplates({ ...data.templates });
    } catch {
      toast.error('שגיאה בטעינת ההגדרות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveTemplates = async () => {
    setIsSaving(true);
    try {
      const updated = await updateTemplates(templates);
      setSettings(updated);
      toast.success('התבניות נשמרו בהצלחה');
    } catch {
      toast.error('שגיאה בשמירת התבניות');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (!settings) return;
    const newLocked = !settings.rsvpLocked;

    if (
      newLocked &&
      !confirm('האם אתה בטוח שברצונך לנעול את כל טפסי ה-RSVP מיידית? האורחים לא יוכלו לעדכן תשובה.')
    ) {
      return;
    }

    setIsLocking(true);
    try {
      const result = await setRsvpLock(newLocked);
      setSettings((prev) =>
        prev ? { ...prev, rsvpLocked: result.rsvpLocked, lockedAt: result.lockedAt } : prev
      );
      toast.success(newLocked ? 'טפסי RSVP ננעלו' : 'טפסי RSVP נפתחו');
    } catch {
      toast.error('שגיאה בשינוי מצב הנעילה');
    } finally {
      setIsLocking(false);
    }
  };

  const handleTriggerReminder30 = async () => {
    if (!confirm('לשלוח תזכורת 30 יום לכל האורחים הרלוונטיים עכשיו?')) return;
    try {
      await triggerReminder30();
      toast.success('משימת התזכורת הופעלה — בדוק לוגים לפרטים');
    } catch {
      toast.error('שגיאה בהפעלת התזכורת');
    }
  };

  const handleTriggerDayOf = async () => {
    if (!confirm('לשלוח ברכת יום האירוע לכל האורחים שאישרו הגעה?')) return;
    try {
      await triggerDayOf();
      toast.success('ברכות יום האירוע הופעלו — בדוק לוגים לפרטים');
    } catch {
      toast.error('שגיאה בהפעלת הברכות');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-serif text-[#faf6ef] tracking-tight">מרכז הודעות</h1>
        <p className="text-white/40 text-sm mt-1">ניהול תבניות WhatsApp ואוטומציה</p>
      </div>

      {/* ── RSVP Lock panel ── */}
      <section className="bg-[#0d1b2a]/80 border border-[#c9a84c]/15 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {settings?.rsvpLocked ? (
                <Lock size={18} className="text-red-400" />
              ) : (
                <Unlock size={18} className="text-emerald-400" />
              )}
              <h2 className="text-[#faf6ef] font-semibold">נעילת RSVP</h2>
            </div>
            <p className="text-white/40 text-sm">
              {settings?.rsvpLocked
                ? `טפסי RSVP נעולים${settings.lockedAt ? ` מאז ${new Date(settings.lockedAt).toLocaleDateString('he-IL')}` : ''}. אורחים לא יוכלו לעדכן תשובה.`
                : 'טפסי RSVP פתוחים. אורחים יכולים לעדכן את תשובתם.'}
            </p>
            <p className="text-white/25 text-xs mt-2">
              הנעילה האוטומטית מתרחשת ב-10.02.2026 (יום האירוע).
            </p>
          </div>

          <button
            onClick={handleToggleLock}
            disabled={isLocking}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0
              ${settings?.rsvpLocked
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLocking ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : settings?.rsvpLocked ? (
              <Unlock size={15} />
            ) : (
              <Lock size={15} />
            )}
            {settings?.rsvpLocked ? 'פתח טפסים' : 'נעל טפסים עכשיו'}
          </button>
        </div>
      </section>

      {/* ── Manual triggers ── */}
      <section className="bg-[#0d1b2a]/80 border border-[#c9a84c]/15 rounded-2xl p-6">
        <h2 className="text-[#faf6ef] font-semibold mb-4 flex items-center gap-2">
          <Play size={16} className="text-[#c9a84c]" />
          הפעלה ידנית
        </h2>
        <p className="text-white/40 text-sm mb-5">
          הפעל משימות תזמון באופן ידני לבדיקה או לצורך דחוף. ההודעות נשלחות ברקע.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleTriggerReminder30}
            className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#e8c97e] text-sm font-medium hover:bg-[#c9a84c]/20 transition-all duration-200 group"
          >
            <Bell size={16} className="group-hover:scale-110 transition-transform" />
            <div className="text-right">
              <p className="font-semibold">שלח תזכורת 30 יום</p>
              <p className="text-[10px] text-white/30 font-normal">לממתינים ולמאשרים</p>
            </div>
          </button>

          <button
            onClick={handleTriggerDayOf}
            className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#e8c97e] text-sm font-medium hover:bg-[#c9a84c]/20 transition-all duration-200 group"
          >
            <CalendarCheck size={16} className="group-hover:scale-110 transition-transform" />
            <div className="text-right">
              <p className="font-semibold">שלח ברכת יום האירוע</p>
              <p className="text-[10px] text-white/30 font-normal">למאשרי הגעה בלבד + Waze</p>
            </div>
          </button>
        </div>

        {/* Scheduler schedule info */}
        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/50" />
            <span>תזכורת 30 יום: 11.01.2026 ב-09:00</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/50" />
            <span>יום האירוע: 10.02.2026 ב-09:00</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span>נעילה אוטומטית: יום לאחר האירוע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
            <span>מענה דחייה: אוטומטי בעת לחיצה</span>
          </div>
        </div>
      </section>

      {/* ── Message templates ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#faf6ef] font-semibold flex items-center gap-2">
              <MessageSquare size={16} className="text-[#c9a84c]" />
              תבניות הודעות WhatsApp
            </h2>
            <p className="text-white/40 text-xs mt-1">
              השתמש ב-{'{{'} {'}}'}placeholders לשמות דינמיים
            </p>
          </div>

          <button
            onClick={handleSaveTemplates}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e8c97e] text-[#0d1b2a] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(201,168,76,0.2)] hover:shadow-[0_4px_20px_rgba(201,168,76,0.35)]"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-[#0d1b2a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            שמור תבניות
          </button>
        </div>

        {TEMPLATE_FIELDS.map((field) => (
          <TemplateCard
            key={field.key}
            field={field}
            value={templates[field.key]}
            onChange={(val) => setTemplates((prev) => ({ ...prev, [field.key]: val }))}
          />
        ))}
      </section>

      {/* Placeholder reference */}
      <section className="bg-[#0d1b2a]/50 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
          מדריך מצייני מקום
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            ['{{guest_name}}', 'שם האורח'],
            ['{{couple_names}}', 'שמות הזוג'],
            ['{{wedding_date}}', 'תאריך החתונה'],
            ['{{venue}}', 'מיקום האירוע'],
            ['{{rsvp_link}}', 'קישור RSVP אישי'],
            ['{{calendar_link}}', 'הוסף ליומן Google'],
            ['{{waze_link}}', 'ניווט Waze'],
          ].map(([placeholder, desc]) => (
            <div key={placeholder} className="flex gap-2">
              <code className="text-[#c9a84c] font-mono shrink-0">{placeholder}</code>
              <span className="text-white/30">{desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MessageCenterPage;
