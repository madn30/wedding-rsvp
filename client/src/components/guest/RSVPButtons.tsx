import { useState } from 'react';
import { RSVPResponse } from '../../types';
import { submitRSVP } from '../../services/authService';
import { Spinner } from '../ui';
import toast from 'react-hot-toast';

interface RSVPButtonsProps {
  token: string;
  onSuccess: (response: RSVPResponse) => void;
}

interface ButtonConfig {
  value: NonNullable<RSVPResponse>;
  label: string;
  emoji: string;
  className: string;
}

const BUTTONS: ButtonConfig[] = [
  {
    value: 'yes',
    label: 'מגיע',
    emoji: '✅',
    className:
      'bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white shadow-emerald-200',
  },
  {
    value: 'no',
    label: 'לא מגיע',
    emoji: '❌',
    className:
      'bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white shadow-red-200',
  },
  {
    value: 'maybe',
    label: 'אולי',
    emoji: '🤔',
    className:
      'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white shadow-amber-200',
  },
];

export const RSVPButtons = ({ token, onSuccess }: RSVPButtonsProps) => {
  const [isLoading, setIsLoading] = useState<NonNullable<RSVPResponse> | null>(null);

  const handleResponse = async (response: NonNullable<RSVPResponse>) => {
    setIsLoading(response);
    try {
      // await submitRSVP(token, response);
      onSuccess(response);
      toast.success('תשובתך נרשמה! 🎉');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error('כבר השבת על ההזמנה');
      } else {
        toast.error('שגיאה. נסה שוב.');
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {BUTTONS.map(({ value, label, emoji, className }) => (
        <button
          key={value}
          onClick={() => handleResponse(value)}
          disabled={isLoading !== null}
          className={`
            ${className}
            flex items-center justify-center gap-3 py-4 px-6 rounded-2xl
            font-semibold text-lg shadow-lg
            hover:scale-105 active:scale-95
            transition-all duration-200
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
        >
          {isLoading === value ? (
            <Spinner size="sm" />
          ) : (
            <>
              <span className="text-2xl">{emoji}</span>
              {label}
            </>
          )}
        </button>
      ))}
    </div>
  );
};
