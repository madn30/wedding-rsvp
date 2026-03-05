import React from "react";
import { useState, useCallback } from "react";
import {
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  X,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEventContext } from "../context/EventContext";
import { DBEvent, EventPayload } from "../services/eventService";

type FormData = EventPayload;
type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_FORM: FormData = {
  name: "",
  groomName: "",
  brideName: "",
  date: "",
  startTime: "",
  location: "",
  description: "",
};

const ALL_FORM_KEYS = Object.keys(INITIAL_FORM) as (keyof FormData)[];

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function formatHebrewDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function validate(form: FormData): FormErrors {
  const e: FormErrors = {};

  if (!form.name.trim()) {
    e.name = "שם האירוע הוא שדה חובה";
  } else if (form.name.trim().length < 2) {
    e.name = "שם קצר מדי — לפחות 2 תווים";
  }

  if (!form.date) {
    e.date = "תאריך הוא שדה חובה";
  } else {
    const selected = new Date(form.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      e.date = "לא ניתן לבחור תאריך בעבר";
    }
  }

  if (!form.startTime) {
    e.startTime = "שעת האירוע היא שדה חובה";
  }

  if (form.description.length > 500) {
    e.description = `תיאור ארוך מדי — ${form.description.length}/500 תווים`;
  }

  if (form.location && form.location.startsWith("http")) {
    try {
      new URL(form.location);
    } catch {
      e.location = "כתובת URL לא תקינה";
    }
  }

  return e;
}

export const EventsPage = () => {
  const {
    events,
    activeEvent,
    isLoading,
    setActiveEvent,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEventContext();

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);

  const handleChange = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        setErrors(validate(next));
        return next;
      });
      setTouched((prev) => new Set([...prev, key]));
    },
    [],
  );

  const handleBlur = useCallback(
    (key: keyof FormData) => {
      setTouched((prev) => new Set([...prev, key]));
      setErrors((prev) => ({ ...prev, ...validate(form) }));
    },
    [form],
  );

  const fieldError = useCallback(
    (key: keyof FormData): string | undefined =>
      touched.has(key) ? errors[key] : undefined,
    [errors, touched],
  );

  const handleEdit = (event: DBEvent) => {
    setEditingId(event._id);
    setForm({
      name: event.name,
      groomName: event.groomName,
      brideName: event.brideName,
      date: event.date,
      startTime: event.startTime,
      location: event.location,
      description: event.description,
    });
    setTouched(new Set());
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setTouched(new Set());
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(new Set(ALL_FORM_KEYS));
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateEvent(editingId, form);
        setEditingId(null);
        toast.success("האירוע עודכן בהצלחה");
      } else {
        await createEvent(form);
        toast.success("האירוע נוצר בהצלחה");
      }
      setForm(INITIAL_FORM);
      setTouched(new Set());
      setErrors({});
    } catch {
      toast.error("שגיאה בשמירת האירוע");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק אירוע זה לצמיתות?")) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      toast.success("האירוע נמחק");
    } catch {
      toast.error("שגיאה במחיקת האירוע");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (event: DBEvent) => {
    setSettingActiveId(event._id);
    try {
      await setActiveEvent(activeEvent?._id === event._id ? null : event);
    } catch {
      toast.error("שגיאה בהגדרת האירוע הפעיל");
    } finally {
      setSettingActiveId(null);
    }
  };

  const baseInput =
    "w-full bg-[#060a11] border rounded-xl px-4 py-2.5 text-[#faf6ef] text-sm focus:outline-none focus:ring-1 transition-all placeholder-white/20";
  const validInput =
    "border-white/10 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20";
  const invalidInput =
    "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20";
  const inputClass = (field: keyof FormData) =>
    `${baseInput} ${fieldError(field) ? invalidInput : validInput}`;
  const labelClass =
    "block text-white/45 text-xs font-medium mb-1.5 tracking-wide";

  const FieldError = ({ field }: { field: keyof FormData }) => {
    const err = fieldError(field);
    if (!err) return null;
    return (
      <p className="flex items-center gap-1 mt-1.5 text-red-400 text-[11px]">
        <AlertCircle size={10} className="text-red-400 shrink-0" /> {err}
      </p>
    );
  };

  return (
    <div dir="rtl" className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-[#faf6ef] tracking-tight">
          ניהול אירועים
        </h1>
        <p className="text-white/35 text-sm mt-1">
          הגדר את פרטי האירוע — הנתונים ישמשו את כל ההודעות והתזמונים במערכת
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6 items-start">
        <div className="xl:sticky xl:top-6">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-[#0d1b2a]/80 border border-[#c9a84c]/15 rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editingId ? (
                  <Pencil size={15} className="text-[#c9a84c]" />
                ) : (
                  <Plus size={15} className="text-[#c9a84c]" />
                )}
                <h2 className="text-[#faf6ef] font-semibold">
                  {editingId ? "עריכת אירוע" : "אירוע חדש"}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <X size={13} className="text-white/40" /> ביטול
                </button>
              )}
            </div>

            <div>
              <label className={labelClass}>שם האירוע</label>
              <input
                type="text"
                placeholder="לדוגמה: חתונת דנה ואורי, בר מצווה, יום הולדת..."
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                className={inputClass("name")}
              />

              <FieldError field="name" />
            </div>

            {}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>שם החתן</label>
                <input
                  type="text"
                  placeholder="הכנס שם"
                  value={form.groomName || ""}
                  onChange={(e) => handleChange("groomName", e.target.value)}
                  onBlur={() => handleBlur("groomName")}
                  className={inputClass("groomName")}
                />

                <FieldError field="groomName" />
              </div>
              <div>
                <label className={labelClass}>שם הכלה</label>
                <input
                  type="text"
                  placeholder="הכנס שם"
                  value={form.brideName || ""}
                  onChange={(e) => handleChange("brideName", e.target.value)}
                  onBlur={() => handleBlur("brideName")}
                  className={inputClass("brideName")}
                />

                <FieldError field="brideName" />
              </div>
            </div>

            <div>
              <label className={labelClass}>תאריך האירוע</label>
              <input
                type="date"
                min={todayIso()}
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                onBlur={() => handleBlur("date")}
                className={inputClass("date")}
              />

              {form.date && !fieldError("date") && (
                <p className="text-[10px] text-[#c9a84c]/60 mt-1.5 font-medium">
                  {formatHebrewDate(form.date)}
                </p>
              )}
              <FieldError field="date" />
            </div>

            <div>
              <label className={labelClass}>שעת האירוע</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                onBlur={() => handleBlur("startTime")}
                className={inputClass("startTime")}
              />

              <FieldError field="startTime" />
            </div>

            <div>
              <label className={labelClass}>מיקום / קישור</label>
              <input
                type="text"
                placeholder="לדוגמה: אולם ביתר, תל אביב..."
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                onBlur={() => handleBlur("location")}
                className={inputClass("location")}
              />

              <FieldError field="location" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>
                  פרטים נוספים
                </label>
                <span
                  className={`text-[10px] tabular-nums ${
                    form.description.length > 450
                      ? form.description.length > 500
                        ? "text-red-400"
                        : "text-amber-400"
                      : "text-white/25"
                  }`}
                >
                  {form.description.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="פרטים, הנחיות לאורחים, הערות למערכת..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                onBlur={() => handleBlur("description")}
                className={`${inputClass("description")} resize-none leading-relaxed`}
              />

              <FieldError field="description" />
            </div>

            <div className="h-px bg-[#c9a84c]/15 rounded-full" />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e8c97e] text-[#0a1520] font-bold py-3.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(201,168,76,0.2)] hover:shadow-[0_4px_24px_rgba(201,168,76,0.35)]"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-[#0a1520] border-t-transparent rounded-full animate-spin" />
              ) : editingId ? (
                <Pencil size={14} className="text-[#0a1520]" />
              ) : (
                <Plus size={14} className="text-[#0a1520]" />
              )}
              {isSubmitting
                ? "שומר..."
                : editingId
                  ? "עדכן אירוע"
                  : "צור אירוע"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[#faf6ef] font-semibold flex items-center gap-2">
              <CalendarClock size={16} className="text-[#c9a84c]" />
              אירועים שמורים
              {events.length > 0 && (
                <span className="text-[10px] bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25 px-2 py-0.5 rounded-full font-bold tabular-nums">
                  {events.length}
                </span>
              )}
            </h2>
            {activeEvent && (
              <span className="text-[10px] text-[#c9a84c]/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse inline-block" />
                פעיל: {formatHebrewDate(activeEvent.date)}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/20 bg-[#0d1b2a]/40 border border-white/5 rounded-2xl gap-2">
              <CalendarClock size={44} className="text-white/15" />
              <p className="text-sm font-medium text-white/30">
                אין אירועים עדיין
              </p>
              <p className="text-xs text-white/20">
                מלא את הטופס כדי ליצור אירוע ראשון
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const isActive = activeEvent?._id === event._id;
                const isEditing = editingId === event._id;
                const isDeleting = deletingId === event._id;
                const isSettingActive = settingActiveId === event._id;

                return (
                  <div
                    key={event._id}
                    className={`rounded-2xl border p-5 space-y-3.5 transition-all duration-300 ${
                      isActive
                        ? "border-[#c9a84c]/40 bg-[#c9a84c]/5 shadow-[0_0_24px_rgba(201,168,76,0.08)]"
                        : isEditing
                          ? "border-blue-500/30 bg-blue-500/[0.04] ring-1 ring-[#c9a84c]/20"
                          : "border-white/8 bg-[#0d1b2a]/60 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 w-2 h-2 rounded-full ${
                            isActive
                              ? "bg-[#c9a84c] animate-pulse"
                              : "bg-white/15"
                          }`}
                        />

                        <div className="min-w-0">
                          <h3 className="text-[#faf6ef] font-semibold text-sm truncate">
                            {event.name}
                          </h3>
                          <p className="text-white/40 text-[11px] mt-0.5">
                            {formatHebrewDate(event.date)}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 tracking-wider">
                          פעיל
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Clock size={11} className="shrink-0 text-white/30" />
                        <span>{event.startTime || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Calendar
                          size={11}
                          className="shrink-0 text-white/30"
                        />

                        <span className="font-mono text-[10px]">
                          {event.date.split("-").reverse().join(".")}
                        </span>
                      </div>
                      {event.location && (
                        <div className="col-span-2 flex items-center gap-1.5 text-white/50 min-w-0">
                          <MapPin
                            size={11}
                            className="shrink-0 text-white/30"
                          />

                          {event.location.startsWith("http") ? (
                            <a
                              href={event.location}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#c9a84c]/70 hover:text-[#c9a84c] truncate transition-colors hover:underline underline-offset-2"
                            >
                              {event.location}
                            </a>
                          ) : (
                            <span className="truncate">{event.location}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <div className="flex gap-1.5 border-t border-white/5 pt-3">
                        <FileText
                          size={11}
                          className="shrink-0 text-white/25 mt-0.5"
                        />

                        <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 border-t border-white/5 pt-3">
                      <button
                        onClick={() => handleSetActive(event)}
                        disabled={isSettingActive}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                          isActive
                            ? "bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#e8c97e]"
                            : "bg-white/[0.04] border border-white/10 text-white/50 hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/30 hover:text-[#e8c97e]"
                        }`}
                      >
                        {isSettingActive ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2
                            size={12}
                            className={
                              isActive ? "text-[#e8c97e]" : "text-white/50"
                            }
                          />
                        )}
                        {isActive ? "פעיל" : "הגדר כפעיל"}
                      </button>

                      <button
                        onClick={() => handleEdit(event)}
                        disabled={isEditing}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-white/50 hover:bg-blue-500/10 hover:border-blue-500/25 hover:text-blue-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pencil size={12} className="text-inherit" />
                        ערוך
                      </button>

                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={isDeleting}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-white/50 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={12} className="text-inherit" />
                        )}
                        מחק
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
