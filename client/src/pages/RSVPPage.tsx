import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RSVPData, RSVPResponse } from '../types';
import { getRSVP } from '../services/authService';
import { RSVPButtons } from '../components/guest/RSVPButtons';
import { FullPageLoader } from '../components/ui';
import s from './RSVPPage.module.css';

const RESPONSE_MESSAGES: Record<NonNullable<RSVPResponse>, { text: string; emoji: string }> = {
  yes:   { text: 'נהדר! אנחנו שמחים שתגיע',  emoji: '🎉' },
  no:    { text: 'חבל, נתגעגע אליך',           emoji: '💔' },
  maybe: { text: 'תעדכן אותנו בהקדם',          emoji: '🤔' },
};

export const RSVPPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData]         = useState<RSVPData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState('');
  const [submitted, setSubmitted] = useState<RSVPResponse>(null);

  useEffect(() => {
    if (!token) return;

    if (token === 'test') {
      const timer = setTimeout(() => {
        setData({
          name: 'ישראל ישראלי',
          coupleNames: 'ליאל ועידן',
          weddingDate: '12.09.2026',
          venue: '',
          response: null,
          respondedAt: null,
          numberOfGuests: 1,
          foodPreference: null,
          transportNeeded: false,
          specialRequests: '',
        });
        setLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }

    getRSVP(token)
      .then(d => {
        setData(d);
        if (d.response) setSubmitted(d.response);
      })
      .catch(() => setError('קישור ה-RSVP אינו תקין או שפג תוקפו.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading) return <FullPageLoader />;

  return (
    <main className={s.page}>
      <article className={s.card}>
        <span className={s.ringIcon} aria-hidden="true">💍</span>

        {error ? (
          <div className={s.errorState}>
            <h1 className={s.errorTitle}>קישור לא תקין</h1>
            <p className={s.errorMsg}>{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Couple + Date */}
            <h1 className={s.coupleNames}>{data.coupleNames}</h1>
            {data.weddingDate && (
              <p className={s.weddingDate}>{data.weddingDate}</p>
            )}

            {/* Divider */}
            <div className={s.divider} aria-hidden="true">
              <div className={s.dividerLine} />
              <span className={s.dividerIcon}>🌸</span>
              <div className={s.dividerLine} />
            </div>

            {/* Guest greeting */}
            <div className={s.greeting}>
              <p className={s.greetingLabel}>שלום,</p>
              <h2 className={s.guestName}>{data.name}</h2>
              <p className={s.cta}>נשמח לראותך בחתונה שלנו!<br />אנא אשר את הגעתך:</p>
            </div>

            {/* Response area */}
            {submitted ? (
              <div className={s.submittedBox}>
                <div className={s.submittedCard}>
                  <p className={s.submittedEmoji} aria-hidden="true">
                    {RESPONSE_MESSAGES[submitted].emoji}
                  </p>
                  <p className={s.submittedMsg}>{RESPONSE_MESSAGES[submitted].text}</p>
                  <p className={s.submittedSub}>תשובתך נרשמה בהצלחה</p>
                </div>
                {data.respondedAt && (
                  <p className={s.submittedDate}>
                    נענה ב‑{new Date(data.respondedAt).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
            ) : (
              <div className={s.btnsWrap}>
                <RSVPButtons token={token!} onSuccess={setSubmitted} />
              </div>
            )}
          </>
        ) : null}
      </article>

      <footer className={s.footer}>
        <p className={s.footerText}>עם אהבה ✨ {data?.coupleNames}</p>
      </footer>
    </main>
  );
};
