import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RSVPData, RSVPResponse } from "../types";
import { getRSVP } from "../services/authService";
import { RSVPButtons } from "../components/guest/RSVPButtons";
import { FullPageLoader } from "../components/ui";
import {
  Heart,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Lock,
} from "lucide-react";

const RESPONSE_MESSAGES: Record<
  NonNullable<RSVPResponse>,
  { text: string; icon: React.ReactNode; color: string }
> = {
  yes: {
    text: "נהדר! אנחנו שמחים שתגיעו",
    icon: <CheckCircle2 size={48} />,
    color: "#c9a84c",
  },
  no: {
    text: "חבל, נתגעגע אליכם",
    icon: <XCircle size={48} />,
    color: "#e74c3c",
  },
  maybe: {
    text: "תעדכנו אותנו בהקדם",
    icon: <HelpCircle size={48} />,
    color: "#94a3b8",
  },
};

export const RSVPPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<RSVPData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<RSVPResponse>(null);

  useEffect(() => {
    if (!token) return;

    if (token === "test") {
      const timer = setTimeout(() => {
        setData({
          name: "ישראל ישראלי",
          coupleNames: "ליאל ועידן",
          weddingDate: "12.09.2026",
          venue: 'אולם האירועים "הגן הקסום"',
          response: null,
          respondedAt: null,
          numberOfGuests: 1,
          foodPreference: null,
          transportNeeded: false,
          specialRequests: "",
        });
        setLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }

    getRSVP(token)
      .then((d) => {
        setData(d);
        if (d.response) setSubmitted(d.response);
      })
      .catch(() => setError("קישור ה-RSVP אינו תקין או שפג תוקפו."))
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading) return <FullPageLoader />;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#111827] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans"
    >
      {}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#c9a84c]/10 to-transparent"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#c9a84c]/5 blur-[100px] rounded-full"></div>

      <article className="w-full max-w-lg bg-[#0d1b2a]/80 backdrop-blur-xl border border-[#c9a84c]/20 rounded-[2rem] shadow-2xl p-8 md:p-12 text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 mb-8 shadow-[0_0_20px_rgba(201,168,76,0.15)]">
          <Heart className="text-[#c9a84c] fill-[#c9a84c]/20" size={28} />
        </div>

        {error ? (
          <div className="py-8">
            <AlertCircle
              size={48}
              className="mx-auto text-red-400 mb-4 opacity-50"
            />

            <h1 className="text-2xl font-serif text-[#faf6ef] mb-2">
              קישור לא תקין
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">{error}</p>
          </div>
        ) : data ? (
          <>
            {}
            <h1 className="text-4xl md:text-5xl font-serif text-[#faf6ef] mb-4 tracking-tight">
              {data.coupleNames.split(" ו").map((name, i) => (
                <span key={name}>
                  {i > 0 && (
                    <em className="text-[#c9a84c] italic font-serif"> ו</em>
                  )}
                  {name}
                </span>
              ))}
            </h1>

            <div className="flex flex-col items-center gap-2 mb-8">
              {data.weddingDate && (
                <p className="flex items-center gap-2 text-[#e8c97e] font-medium tracking-[0.2em] text-sm uppercase">
                  <Calendar size={14} /> {data.weddingDate}
                </p>
              )}
              {data.venue && (
                <p className="flex items-center gap-2 text-white/40 text-xs">
                  <MapPin size={12} /> {data.venue}
                </p>
              )}
            </div>

            {}
            <div
              className="flex items-center justify-center gap-4 mb-10 overflow-hidden"
              aria-hidden="true"
            >
              <div className="h-px w-16 bg-gradient-to-l from-[#c9a84c]/40 to-transparent" />
              <Sparkles className="text-[#c9a84c]/40" size={16} />
              <div className="h-px w-16 bg-gradient-to-r from-[#c9a84c]/40 to-transparent" />
            </div>

            {}
            <div className="mb-10">
              <p className="text-[#c9a84c] font-serif italic text-lg mb-1">
                שלום,
              </p>
              <h2 className="text-3xl font-bold text-[#faf6ef] mb-4">
                {data.name}
              </h2>
              <p className="text-white/60 text-base leading-relaxed max-w-[280px] mx-auto">
                נשמח מאוד לראות אתכם חוגגים איתנו ביום המיוחד שלנו!
              </p>
            </div>

            {}
            {data.isExpired && (
              <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-3">
                <Lock size={18} className="text-white/40 shrink-0 mt-0.5" />
                <div className="text-right">
                  <p className="text-[#faf6ef] text-sm font-semibold">
                    האירוע הסתיים
                  </p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    The event is over and RSVP updates are closed.
                  </p>
                </div>
              </div>
            )}

            {}
            {submitted ? (
              <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center">
                  <div
                    className="mb-4"
                    style={{ color: RESPONSE_MESSAGES[submitted].color }}
                  >
                    {RESPONSE_MESSAGES[submitted].icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#faf6ef] mb-2">
                    {RESPONSE_MESSAGES[submitted].text}
                  </h3>
                  <p className="text-white/40 text-sm">תשובתך נרשמה במערכת</p>

                  {data.respondedAt && (
                    <div className="mt-6 pt-4 border-t border-white/5 w-full">
                      <p className="text-[10px] uppercase tracking-widest text-white/20">
                        נשלח בתאריך{" "}
                        {new Date(data.respondedAt).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : data.isExpired ? null : (
              <div className="w-full space-y-4">
                <p className="text-[#e8c97e] text-xs font-bold tracking-widest uppercase mb-4">
                  אנא אשרו הגעתכם:
                </p>
                <RSVPButtons token={token!} onSuccess={setSubmitted} />
              </div>
            )}
          </>
        ) : null}
      </article>

      <footer className="mt-12 text-center relative z-10">
        <p className="text-white/30 text-sm font-serif italic flex items-center gap-2 justify-center">
          נוצר באהבה עבור {data?.coupleNames}{" "}
          <Heart size={12} className="fill-current" />
        </p>
      </footer>
    </main>
  );
};
