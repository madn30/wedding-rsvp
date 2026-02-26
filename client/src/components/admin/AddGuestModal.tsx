import { useState, FormEvent } from 'react';
import { GuestForm } from '../../types';
import { createGuest } from '../../services/guestService';
import { Modal, Spinner } from '../ui';
import toast from 'react-hot-toast';
import s from './AddGuestModal.module.css';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createGuest(form);
      toast.success(`${form.name} נוסף/ה בהצלחה! 🎉`);
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
    <Modal isOpen={isOpen} onClose={onClose} title="הוספת אורח חדש">
      <form onSubmit={handleSubmit} className={s.form} noValidate>
        <div className={s.field}>
          <label htmlFor="guest-name" className={s.label}>שם מלא</label>
          <input
            id="guest-name"
            className={s.input}
            placeholder="ישראל ישראלי"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            autoComplete="off"
          />
        </div>

        <div className={s.field}>
          <label htmlFor="guest-phone" className={s.label}>מספר טלפון</label>
          <input
            id="guest-phone"
            type="tel"
            className={s.input}
            placeholder="05XXXXXXXX"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            dir="ltr"
            required
            autoComplete="tel"
          />
          <p className={s.hint}>פורמט: 05XXXXXXXX או +9725XXXXXXXX</p>
        </div>

        {error && (
          <p className={s.errorBox} role="alert">
            <span aria-hidden="true">⚠️</span>
            {error}
          </p>
        )}

        <div className={s.footer}>
          <button type="submit" className={s.submitBtn} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : <span aria-hidden="true">➕</span>}
            הוסף אורח
          </button>
          <button type="button" className={s.cancelBtn} onClick={onClose}>
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  );
};
