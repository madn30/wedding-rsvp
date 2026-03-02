import { useState, FormEvent } from 'react';
import { GuestForm } from '../../types';
import { createGuest } from '../../services/guestService';
import { Spinner } from '../ui';
import toast from 'react-hot-toast';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_FORM: GuestForm = { name: '', phone: '' };

export const AddGuestModal = ({ isOpen, onClose, onSuccess }: AddGuestModalProps) => {
  const [form, setForm]         = useState<GuestForm>(EMPTY_FORM);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createGuest(form);
      toast.success(`${form.name} נוסף/ה בהצלחה! 🎉`, {
        style: { background: '#0d1b2a', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }
      });
      setForm(EMPTY_FORM);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'שגיאה בהוספת האורח';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity" dir="rtl">
      <div className="bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-serif text-[#e8c97e] flex items-center gap-2">
            <UserPlus size={20} className="text-[#c9a84c]" />
            הוספת אורח חדש
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          <div>
            <label htmlFor="guest-name" className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5 font-semibold">שם מלא</label>
            <input
              id="guest-name"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-all"
              placeholder="לדוגמה: ישראל ישראלי"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="guest-phone" className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5 font-semibold">מספר טלפון</label>
            <input
              id="guest-phone"
              type="tel"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-all font-mono"
              placeholder="05XXXXXXXX"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              dir="ltr"
              required
              autoComplete="tel"
            />
            <p className="text-[10px] text-white/30 mt-1.5">פורמט נתמך: 05XXXXXXXX או +9725XXXXXXXX</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2" role="alert">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-[#c9a84c] text-[#0d1b2a] py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#c9a84c]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? <Spinner size="sm" /> : <UserPlus size={18} />}
              {isLoading ? 'מוסיף...' : 'הוסף אורח'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
};