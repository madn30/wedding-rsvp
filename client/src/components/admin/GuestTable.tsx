import { useState } from 'react';
import { Guest } from '../../types';
import { ResponseBadge, Spinner } from '../ui';
import { sendWhatsAppInvitation, deleteGuest } from '../../services/guestService';
import toast from 'react-hot-toast';
import { MessageCircle, ExternalLink, Trash2, Users } from 'lucide-react';

interface GuestTableProps {
  guests: Guest[];
  onRefresh: () => void;
}

export const GuestTable = ({ guests, onRefresh }: GuestTableProps) => {
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
      <div className="flex flex-col items-center justify-center p-16 text-white/30 text-center">
        <Users size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-serif italic">לא נמצאו אורחים התואמים לחיפוש</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead className="bg-white/[0.03] border-b border-[#c9a84c]/20 text-[#e8c97e] font-serif text-sm">
          <tr>
            {['שם', 'טלפון', 'תשובה', 'הודעה', 'תאריך', 'פעולות'].map(h => (
              <th key={h} className="p-4 whitespace-nowrap font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {guests.map(guest => (
            <tr key={guest._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td className="p-4 font-semibold text-[#faf6ef] whitespace-nowrap">
                {guest.name}
              </td>
              <td className="p-4 text-white/70 font-mono text-xs whitespace-nowrap" dir="ltr">
                {guest.phone}
              </td>
              <td className="p-4 whitespace-nowrap">
                <ResponseBadge response={guest.response} />
              </td>
              <td className="p-4 whitespace-nowrap">
                {guest.messageSent ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2ecc71]/10 border border-[#2ecc71]/20 text-[#2ecc71] text-[11px] font-bold tracking-wider">
                    <MessageCircle size={12} /> נשלח
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[11px] font-bold tracking-wider">
                    לא נשלח
                  </span>
                )}
              </td>
              <td className="p-4 text-white/40 text-xs whitespace-nowrap">
                {guest.respondedAt
                  ? new Date(guest.respondedAt).toLocaleDateString('he-IL')
                  : '—'}
              </td>
              <td className="p-4 whitespace-nowrap">
                {loadingId === guest._id ? (
                  <div className="flex justify-center w-[100px]"><Spinner size="sm" /></div>
                ) : (
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 rounded-lg bg-[#2ecc71]/10 text-[#2ecc71] hover:bg-[#2ecc71]/20 transition-colors"
                      onClick={() => handleSend(guest)}
                      title="שלח הזמנה ב-WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <a
                      href={`/rsvp/${guest.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      title="פתח לינק RSVP"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      onClick={() => handleDelete(guest)}
                      title="מחק אורח"
                    >
                      <Trash2 size={16} />
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