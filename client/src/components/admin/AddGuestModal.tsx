import { useState, FormEvent } from 'react';
import { GuestForm } from '../../types';
import { createGuest } from '../../services/guestService';
import { Modal, Spinner } from '../ui';
import toast from 'react-hot-toast';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm: GuestForm = { name: '', phone: '' };

export const AddGuestModal = ({ isOpen, onClose, onSuccess }: AddGuestModalProps) => {
  const [form, setForm] = useState<GuestForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await createGuest(form);
      toast.success(`${form.name} נוסף/ה בהצלחה! 🎉`);
      setForm(initialForm);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'שגיאה בהוספת האורח';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="הוספת אורח חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
          <input
            className="input-field"
            placeholder="ישראל ישראלי"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מספר טלפון
          </label>
          <input
            className="input-field"
            placeholder="05XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            dir="ltr"
            required
          />
          <p className="text-xs text-gray-400 mt-1">פורמט: 05XXXXXXXX או +9725XXXXXXXX</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : '➕'}
            הוסף אורח
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  );
};
