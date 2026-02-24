import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RSVPData, RSVPResponse } from '../types';
import { getRSVP } from '../services/authService';
import { RSVPButtons } from '../components/guest/RSVPButtons';
import { FullPageLoader } from '../components/ui';

const RESPONSE_MESSAGES: Record<NonNullable<RSVPResponse>, string> = {
  yes: 'נהדר! אנחנו שמחים שתגיע 🎉',
  no: 'חבל, נתגעגע אליך 💔',
  maybe: 'תעדכן אותנו בהקדם 🙏',
};

export const RSVPPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<RSVPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<RSVPResponse>(null);

  useEffect(() => {
    if (!token) return;

    if (token === 'test') {
      setTimeout(() => { 
        setData({
          name: 'ישראל ישראלי',
          coupleNames: 'ליאל ועידן',
          weddingDate: '12.09.2026',
          response: null,
        } as RSVPData);
        setIsLoading(false);
      }, 800);
      return;
    }

    // 🌐 Real Backend Call
    getRSVP(token)
      .then((d) => {
        setData(d);
        if (d.response) setSubmitted(d.response);
      })
      .catch(() => setError('קישור ה-RSVP אינו תקין או שפג תוקפו.'))
      .finally(() => setIsLoading(false));
  }, [token]);
  if (isLoading) return <FullPageLoader />;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #fff1f2 0%, #fce7f3 30%, #fdf2f8 60%, #fffbeb 100%)',
      }}
    >
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-pink-200/20 rounded-full blur-2xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="glass-card p-8 text-center">
          {/* Ring decoration */}
          <div className="text-6xl mb-2 animate-pulse-soft">💍</div>

          {error ? (
            <div className="space-y-4">
              <h1 className="font-serif text-2xl font-bold text-gray-700">
                קישור לא תקין
              </h1>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Couple Names & Date */}
              <div className="mb-6">
                <h1 className="font-serif text-3xl font-bold text-gray-800 leading-tight">
                  {data.coupleNames}
                </h1>
                {data.weddingDate && (
                  <p className="text-rose-400 font-medium mt-1">{data.weddingDate}</p>
                )}
                <div className="my-4 flex items-center gap-2">
                  <div className="flex-1 h-px bg-rose-200" />
                  <span className="text-rose-300 text-sm">🌸</span>
                  <div className="flex-1 h-px bg-rose-200" />
                </div>
              </div>

              {/* Guest greeting */}
              <div className="mb-8">
                <p className="text-gray-500 text-sm mb-1">שלום,</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-800">
                  {data.name}
                </h2>
                <p className="text-gray-600 mt-3 leading-relaxed">
                  נשמח לראותך בחתונה שלנו! אנא אשר את הגעתך:
                </p>
              </div>

              {/* Already responded */}
              {submitted ? (
                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                    <div className="text-3xl mb-2">
                      {submitted === 'yes' ? '🎉' : submitted === 'no' ? '💔' : '🤔'}
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">
                      {RESPONSE_MESSAGES[submitted]}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      תשובתך נרשמה בהצלחה
                    </p>
                  </div>
                  {data.respondedAt && (
                    <p className="text-xs text-gray-400">
                      נענה ב-{new Date(data.respondedAt).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex justify-center">
                  <RSVPButtons token={token!} onSuccess={setSubmitted} />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-rose-300 mt-6">
          עם אהבה ✨ {data?.coupleNames}
        </p>
      </div>
    </div>
  );
};
