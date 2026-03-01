import { useState } from 'react';
import { Guest } from '../../types';
import { ResponseBadge, Spinner } from '../ui';
import { sendWhatsAppInvitation, deleteGuest } from '../../services/guestService';
import toast from 'react-hot-toast';
import s from './GuestTable.module.css';

interface GuestTableProps {
  guests: Guest[];
  onRefresh: () => void;
  whatsAppReady: boolean;
}

export const GuestTable = ({ guests, onRefresh, whatsAppReady }: GuestTableProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSend = async (guest: Guest) => {
    setLoadingId(guest._id);
    try {
      await sendWhatsAppInvitation(guest);
      toast.success(`הזמנה נשלחה ל${guest.name} 📱`);
      onRefresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'שגיאה בשליחת ההזמנה';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!confirm(`למחוק את ${guest.name}?`)) return;
    try {
      await deleteGuest(guest._id);
      toast.success('האורח נמחק');
      onRefresh();
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  if (guests.length === 0) {
    return (
      <div className={s.empty}>
        <span className={s.emptyIcon}>👥</span>
        <p className={s.emptyText}>לא נמצאו אורחים</p>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            {['שם', 'טלפון', 'תשובה', 'הודעה', 'תאריך תשובה', 'פעולות'].map(h => (
              <th key={h} className={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map(guest => (
            <tr key={guest._id} className={s.tr}>
              <td className={`${s.td} ${s.tdName}`} data-label="שם">
                {guest.name}
              </td>
              <td className={`${s.td} ${s.tdPhone}`} data-label="טלפון">
                {guest.phone}
              </td>
              <td className={s.td} data-label="תשובה">
                <ResponseBadge response={guest.response} />
              </td>
              <td className={s.td} data-label="הודעה">
                {guest.messageSent ? (
                  <span className={`${s.msgChip} ${s.msgSent}`}>
                    📱 WhatsApp
                  </span>
                ) : (
                  <span className={`${s.msgChip} ${s.msgUnsent}`}>לא נשלח</span>
                )}
              </td>
              <td className={s.td} data-label="תאריך תשובה">
                {guest.respondedAt
                  ? new Date(guest.respondedAt).toLocaleDateString('he-IL')
                  : '—'}
              </td>
              <td className={s.td} data-label="פעולות">
                {loadingId === guest._id ? (
                  <Spinner size="sm" />
                ) : (
                  <div className={s.actions}>
                    <button
                      className={`${s.actionBtn} ${s.actionWhatsapp} ${!whatsAppReady ? s.actionDisabled : ''}`}
                      onClick={() => handleSend(guest)}
                      disabled={!whatsAppReady}
                      title={whatsAppReady ? 'שלח הזמנה ב-WhatsApp' : 'WhatsApp לא מחובר'}
                      aria-label={`שלח הזמנה ב-WhatsApp ל${guest.name}`}
                    >
                      📱
                    </button>
                    <a
                      href={`/rsvp/${guest.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`${s.actionBtn} ${s.actionLink}`}
                      title="פתח לינק RSVP"
                      aria-label={`לינק RSVP של ${guest.name}`}
                    >
                      🔗
                    </a>
                    <button
                      className={`${s.actionBtn} ${s.actionDelete}`}
                      onClick={() => handleDelete(guest)}
                      title="מחק"
                      aria-label={`מחק את ${guest.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
