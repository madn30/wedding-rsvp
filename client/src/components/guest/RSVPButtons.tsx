import { useState } from 'react';
import { RSVPResponse } from '../../types';
import { submitRSVP } from '../../services/authService';
import { Spinner } from '../ui';
import toast from 'react-hot-toast';
import s from './RSVPButtons.module.css';

interface RSVPButtonsProps {
  token: string;
  onSuccess: (response: RSVPResponse) => void;
}

interface ButtonDef {
  value: NonNullable<RSVPResponse>;
  label: string;
  emoji: string;
  cls: string;
}

const BUTTONS: ButtonDef[] = [
  { value: 'yes',   label: 'מגיע',     emoji: '✅', cls: s.btnYes },
  { value: 'no',    label: 'לא מגיע',  emoji: '❌', cls: s.btnNo },
  { value: 'maybe', label: 'אולי',     emoji: '🤔', cls: s.btnMaybe },
];

export const RSVPButtons = ({ token, onSuccess }: RSVPButtonsProps) => {
  const [loading, setLoading] = useState<NonNullable<RSVPResponse> | null>(null);

  const handleResponse = async (response: NonNullable<RSVPResponse>) => {
    setLoading(response);
    try {
      await submitRSVP(token, { response });
      onSuccess(response);
      toast.success('תשובתך נרשמה! 🎉');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? 'כבר השבת על ההזמנה' : 'שגיאה. נסה שוב.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={s.group} role="group" aria-label="בחר תשובה">
      {BUTTONS.map(({ value, label, emoji, cls }) => (
        <button
          key={value}
          className={`${s.btn} ${cls}`}
          onClick={() => handleResponse(value)}
          disabled={loading !== null}
          aria-label={label}
        >
          {loading === value ? (
            <Spinner size="sm" />
          ) : (
            <span className={s.btnEmoji} aria-hidden="true">{emoji}</span>
          )}
          {label}
        </button>
      ))}
    </div>
  );
};
